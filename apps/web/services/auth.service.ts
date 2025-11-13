import { supabase } from '@/lib/supabase';
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
   * Find employee by human readable ID in employees table
   */
  private async findEmployeeByHumanReadableId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, human_readable_id, employment_status, can_login, full_name, email')
        .eq('human_readable_id', userId)
        .single();

      if (error || !data) {
        console.error('Employee lookup error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database query error:', error);
      return null;
    }
  }

  /**
   * Authenticate user with Supabase auth and return JWT token
   * Uses user readable ID + password to authenticate
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { userId, password } = credentials;

    // First, find the employee to get their email from employees table
    const employee = await this.findEmployeeByHumanReadableId(userId.trim());

    if (!employee) {
      throw new Error('Invalid user ID or password');
    }

    // Check if employee can login based on employment status
    if (!employee.can_login) {
      const message = this.getEmploymentStatusMessage(employee.employment_status);
      throw new Error(message);
    }

    // Authenticate with Supabase using email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: employee.email || '',
      password: password,
    });

    if (authError || !authData.user) {
      throw new Error('Invalid user ID or password');
    }

    // Generate JWT token with employee claims (for API access)
    const token = jwtService.generateToken({
      employeeId: employee.id,
      humanReadableId: employee.human_readable_id,
      employmentStatus: employee.employment_status,
      canLogin: employee.can_login,
    });

    // Create authenticated user object
    const authenticatedUser: AuthenticatedUser = {
      id: employee.id,
      humanReadableId: employee.human_readable_id,
      fullName: employee.full_name || '',
      email: employee.email || '',
      employmentStatus: employee.employment_status,
      canLogin: employee.can_login,
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
  async hasExceededRateLimit(_ipAddress: string): Promise<boolean> {
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