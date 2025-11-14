import { createClient } from '@/utils/supabase/server';
import { jwtService } from '@/lib/jwt';
import {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
  LogoutResponse,
  AuthenticatedUser,
  EmploymentStatus
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
        fullName: userMetadata.full_name || user.email || '',
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
   * Find employee by human readable ID in employees table
   */
  private async findEmployeeByHumanReadableId(userId: string) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('employees')
        .select('id, human_readable_user_id, employment_status, can_login, email, first_name, last_name')
        .eq('human_readable_user_id', userId)
        .single();

      if (error || !data) {
        console.error('Employee lookup error:', error);
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
    } catch (error) {
      console.error('Database query error:', error);
      return null;
    }
  }

  
  /**
   * Authenticate user with Supabase auth and return session info
   * Supports both email (admin) and userId (employee) login
   * Admin users do not get JWT tokens since they only login via Next.js
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 Login attempt started:', { email: credentials.email, userId: credentials.userId });
    const { email, userId, password } = credentials;
    const supabase = await createClient();
    let employee: {
      id: string;
      human_readable_id: string;
      employment_status: EmploymentStatus;
      can_login: boolean;
      full_name: string;
      email: string;
      first_name: string;
      last_name: string;
    } | null = null;
    let authEmail = '';

    try {
      // If email is provided (admin login), authenticate directly with email
      if (email) {
        console.log('👨‍💼 Attempting admin login with email:', email);
        const authEmail = email.trim();

        console.log('🔑 Authenticating with Supabase...');
        // Authenticate with Supabase using email and password
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password,
        });

        console.log('📊 Supabase auth result:', { authError: authError?.message, hasUser: !!authData?.user });

        if (authError || !authData.user) {
          console.log('❌ Authentication failed:', authError?.message);
          throw new Error('Invalid email or password');
        }

        console.log('👤 User authenticated, checking admin role...');
        // Check if user has admin role from user_metadata (raw_user_meta_data)
        const userMetadata = authData.user.user_metadata || {};
        console.log('🔍 User metadata:', userMetadata);

        if (userMetadata.role !== 'admin') {
          console.log('🚫 User is not admin, signing out...');
          await supabase.auth.signOut();
          throw new Error('Access denied - admin privileges required');
        }

        console.log('✅ Admin user verified');
        // Admin users don't get JWT tokens since they only login via Next.js
        // Create authenticated user object for admin
        const authenticatedUser: AuthenticatedUser = {
          id: authData.user.id,
          humanReadableId: authEmail,
          fullName: userMetadata.full_name || authEmail,
          email: authEmail,
          employmentStatus: 'ACTIVE',
          canLogin: true,
        };

        const response = {
          message: 'Login successful',
          token: '', // No JWT for admin users
          employee: authenticatedUser,
        };
        console.log('✅ Admin login successful:', response);
        return response;
      } else if (userId) {
        console.log('👷 Attempting employee login with user ID:', userId);
        // Employee login with User ID
        employee = await this.findEmployeeByHumanReadableId(userId.trim());
        if (!employee) {
          console.log('❌ Employee not found');
          throw new Error('Invalid user ID or password');
        }

        console.log('👷 Employee found:', { id: employee.id, email: employee.email });
        // Authenticate with Supabase using employee's email and password
        authEmail = employee.email || '';
        console.log('🔑 Authenticating employee with Supabase...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password,
        });

        console.log('📊 Employee auth result:', { authError: authError?.message, hasUser: !!authData?.user });

        if (authError || !authData.user) {
          console.log('❌ Employee authentication failed:', authError?.message);
          throw new Error('Invalid user ID or password');
        }
      } else {
        throw new Error('Email or User ID is required');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      throw error;
    }

    // Check if employee can login based on employment status
    if (employee && !employee.can_login) {
      await supabase.auth.signOut();
      const message = this.getEmploymentStatusMessage(employee.employment_status);
      throw new Error(message);
    }

    // Generate JWT token for employee (for API access)
    const token = jwtService.generateToken({
      employeeId: employee?.id || 'admin',
      humanReadableId: employee?.human_readable_id || authEmail,
      employmentStatus: employee?.employment_status || 'ACTIVE',
      canLogin: employee?.can_login ?? true,
    });

    // Create authenticated user object
    const authenticatedUser: AuthenticatedUser = {
      id: employee?.id || 'admin',
      humanReadableId: employee?.human_readable_id || authEmail,
      fullName: employee?.full_name || authEmail,
      email: authEmail,
      employmentStatus: employee?.employment_status || 'ACTIVE',
      canLogin: employee?.can_login ?? true,
    };

    return {
      message: 'Login successful',
      token,
      employee: authenticatedUser,
    };
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

    return {
      token: newToken,
    };
  }

  /**
   * Logout user (extracts user ID from JWT for Supabase logout)
   */
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
   * Simple implementation - in production would use Redis or dedicated table
   */
  async trackFailedLoginAttempt(userId: string, ipAddress: string): Promise<void> {
    try {
      // Log failed attempt - in production would store in database or Redis
      console.log(`Failed login attempt for user ${userId} from IP ${ipAddress} at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Failed to track login attempt:', error);
    }
  }

  /**
   * Check if user has exceeded rate limit
   * Simple implementation - in production would use Redis or rate limiting service
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