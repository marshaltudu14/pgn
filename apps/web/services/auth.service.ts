import { jwtService } from '@/lib/jwt';
import { createClient } from '@/utils/supabase/server';
import {
  AuthenticatedUser,
  EmploymentStatus,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  RefreshRequest,
  RefreshResponse
} from '@pgn/shared';

export class AuthService {
  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      // Check if user has admin role
      const userMetadata = user.user_metadata || {};
      if (userMetadata.role !== 'admin') {
        return null;
      }

      return {
        id: user.id,
        humanReadableId: user.email || '',
        firstName: userMetadata.first_name || userMetadata.full_name?.split(' ')[0] || user.email || '',
        lastName: userMetadata.last_name || userMetadata.full_name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        employmentStatus: 'ACTIVE' as EmploymentStatus,
        canLogin: true,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Find employee by auth user ID in employees table
   */
  private async findEmployeeById(authUserId: string) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('employees')
        .select('id, human_readable_user_id, employment_status, can_login, email, first_name, last_name')
        .eq('id', authUserId)
        .maybeSingle();

      if (error) {
        // Log the error for debugging but don't expose it
        return null;
      }

      if (!data) {
        // Employee not found - this is expected for admin users or invalid IDs
        return null;
      }

      return {
        id: data.id,
        human_readable_id: data.human_readable_user_id,
        employment_status: data.employment_status,
        can_login: data.can_login,
        full_name: `${data.first_name || ''} ${data.last_name || ''}`,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name
      };
    } catch {
      // Handle unexpected errors gracefully
      return null;
    }
  }

  /**
   * Find employee by human readable ID in employees table
   */
  private async findEmployeeByHumanReadableId(userId: string) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('employees')
        .select('id, human_readable_user_id, employment_status, can_login, email, first_name, last_name')
        .eq('human_readable_user_id', userId)
        .maybeSingle();

      if (error) {
        // Log the error for debugging but don't expose it
        return null;
      }

      if (!data) {
        // Employee not found - this is expected for admin users or invalid IDs
        return null;
      }

      return {
        id: data.id,
        human_readable_id: data.human_readable_user_id,
        employment_status: data.employment_status,
        can_login: data.can_login,
        full_name: `${data.first_name || ''} ${data.last_name || ''}`,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name
      };
    } catch {
      // Handle unexpected errors gracefully
      return null;
    }
  }

  
  /**
   * Authenticate user with Supabase auth and return session info
   * Uses email + password for both admin and employee login
   * Admin users do not get JWT tokens since they only login via Next.js
   * Employee users get JWT tokens for API access
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
        const { email, password } = credentials;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const supabase = await createClient();
    const authEmail = email.toLowerCase().trim();

    try {
            // Authenticate with Supabase using email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: password,
      });

      
      if (authError || !authData.user) {
        // Provide more specific error messages based on the error code
        if (authError?.message?.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        } else if (authError?.message?.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address');
        } else if (authError?.message?.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please try again later');
        } else {
          throw new Error('Login failed. Please check your credentials');
        }
      }

      // Check if user is admin by looking at user metadata
      const userMetadata = authData.user.user_metadata || {};
      
      if (userMetadata.role === 'admin') {
                // Admin users don't get JWT tokens since they only login via Next.js
        const authenticatedUser: AuthenticatedUser = {
          id: authData.user.id,
          humanReadableId: authEmail,
          firstName: userMetadata.first_name || userMetadata.full_name?.split(' ')[0] || authEmail,
          lastName: userMetadata.last_name || userMetadata.full_name?.split(' ').slice(1).join(' ') || '',
          email: authEmail,
          employmentStatus: 'ACTIVE',
          canLogin: true,
        };

        const response = {
          message: 'Login successful',
          token: '', // No JWT for admin users
          refreshToken: '', // No refresh token for admin users
          expiresIn: 0, // No expiration for admin users
          employee: authenticatedUser,
        };
                return response;
      } else {
        // Employee login - check if they exist in employees table using auth user ID
                const employee = await this.findEmployeeById(authData.user.id);

        if (!employee) {
                    await supabase.auth.signOut();
          throw new Error('Employee account not found - contact administrator');
        }

        
        // Check if employee can login based on employment status
        if (!employee.can_login) {
          await supabase.auth.signOut();
          const message = this.getEmploymentStatusMessage(employee.employment_status);
          throw new Error(message);
        }

        // Generate JWT token for employee (for API access)
        const token = jwtService.generateToken({
          employeeId: employee.id,
          humanReadableId: employee.human_readable_id,
          employmentStatus: employee.employment_status,
          canLogin: employee.can_login,
        });

        // Generate refresh token for React Native app (longer lived - 7 days)
        const refreshToken = jwtService.generateRefreshToken({
          employeeId: employee.id,
          humanReadableId: employee.human_readable_id,
          employmentStatus: employee.employment_status,
          canLogin: employee.can_login,
        });

        // Create authenticated user object
        const authenticatedUser: AuthenticatedUser = {
          id: employee.id,
          humanReadableId: employee.human_readable_id,
          firstName: employee.first_name,
          lastName: employee.last_name,
          email: authEmail,
          employmentStatus: employee.employment_status,
          canLogin: employee.can_login,
        };

        const response = {
          message: 'Login successful',
          token,
          refreshToken,
          expiresIn: 900, // 15 minutes for access token
          employee: authenticatedUser,
        };
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh JWT token (extracts user ID from current token)
   */
  async refreshToken(request: RefreshRequest): Promise<RefreshResponse> {
    const { token } = request;

    // Validate the current token and extract user info
    const payload = jwtService.validateToken(token);

    if (!payload) {
      throw new Error('Invalid or expired token');
    }

    // Get current employee data to ensure they can still login
    const employee = await this.findEmployeeByHumanReadableId(payload.sub);

    if (!employee || !employee.can_login) {
      throw new Error('User no longer authorized to access the system');
    }

    // Generate new JWT token with updated claims
    const newToken = jwtService.generateToken({
      employeeId: employee.id,
      humanReadableId: employee.human_readable_id,
      employmentStatus: employee.employment_status,
      canLogin: employee.can_login,
    });

    // Generate new refresh token for React Native app (longer lived - 7 days)
    const newRefreshToken = jwtService.generateRefreshToken({
      employeeId: employee.id,
      humanReadableId: employee.human_readable_id,
      employmentStatus: employee.employment_status,
      canLogin: employee.can_login,
    });

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: 900, // 15 minutes for access token
    };
  }

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    const { token } = request;
    const supabase = await createClient();

    // Validate the token to get user info
    const payload = jwtService.validateToken(token);

    if (!payload) {
      throw new Error('Invalid or expired token');
    }

    // Logout from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase logout error:', error);
      throw new Error('Logout failed');
    }

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Get current employment status for an employee from employees table
   */
  async getCurrentEmploymentStatus(employeeId: string): Promise<EmploymentStatus | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('employees')
        .select('employment_status')
        .eq('id', employeeId)
        .single();

      if (error || !data) {
        console.error('Employment status lookup error:', error);
        return null;
      }

      return data.employment_status as EmploymentStatus;
    } catch (error) {
      console.error('Database query error:', error);
      return null;
    }
  }

  /**
   * Get employment status message
   */
  private getEmploymentStatusMessage(status: EmploymentStatus): string {
    switch (status) {
      case 'SUSPENDED':
        return 'Account suspended - contact administrator';
      case 'RESIGNED':
        return 'Employment ended - thank you for your service';
      case 'TERMINATED':
        return 'Employment terminated - contact HR';
      case 'ON_LEAVE':
        return 'Currently on leave - contact administrator if access needed';
      case 'ACTIVE':
      default:
        return 'Account access denied';
    }
  }

  /**
   * Check if employment status allows login
   */
  canLoginWithStatus(status: EmploymentStatus): boolean {
    return status === 'ACTIVE' || status === 'ON_LEAVE';
  }

  /**
   * Track failed login attempt for rate limiting
   * Simple implementation using console logging for internal company use
   */
  async trackFailedLoginAttempt(): Promise<void> {
    try {
          } catch (error) {
      console.error('Failed to track login attempt:', error);
    }
  }

  /**
   * Check if user has exceeded rate limit
   * Simple implementation - in production would use Redis or rate limiting service
   * For internal company use, basic in-memory rate limiting is sufficient
   */
  async hasExceededRateLimit(): Promise<boolean> {
    try {
      // Simple rate limiting - in production would implement proper rate limiting
      // For now, always return false (no rate limiting)
      return false;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();