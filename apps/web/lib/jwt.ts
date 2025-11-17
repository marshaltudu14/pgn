import jwt, { SignOptions } from 'jsonwebtoken';
import {
  JWTPayload,
  TokenGenerateOptions
} from '@pgn/shared';

export class JWTService {
  private secret: string;
  private expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '15m';

    if (!process.env.JWT_SECRET) {
      console.warn('WARNING: Using fallback JWT secret. Set JWT_SECRET in production!');
    }
  }

  /**
   * Generate a JWT token for an authenticated employee
   */
  generateToken(tokenOptions: TokenGenerateOptions): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: tokenOptions.humanReadableId,
      employeeId: tokenOptions.employeeId,
      employmentStatus: tokenOptions.employmentStatus,
      canLogin: tokenOptions.canLogin,
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'pgn-auth',
      audience: 'pgn-web',
    } as SignOptions);
  }

  /**
   * Validate and decode a JWT token
   */
  validateToken(token: string): JWTPayload | null {
    try {
      const verifyOptions = {
        issuer: 'pgn-auth',
        audience: 'pgn-web',
      };

      const decoded = jwt.verify(token, this.secret, verifyOptions) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        } else if (error instanceof jwt.JsonWebTokenError) {
        } else {
        }
      return null;
    }
  }

  /**
   * Refresh an existing token by generating a new one
   * This implements sliding expiration behavior
   */
  refreshToken(oldToken: string): string | null {
    try {
      // Verify the old token (even if expired) to get the payload
      const decoded = jwt.decode(oldToken) as JWTPayload;

      if (!decoded || !decoded.employeeId || !decoded.sub) {
        return null;
      }

      // Generate a new token with the same claims
      return this.generateToken({
        employeeId: decoded.employeeId,
        humanReadableId: decoded.sub,
        employmentStatus: decoded.employmentStatus,
        canLogin: decoded.canLogin,
      });
    } catch (error) {
        return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}

// Export singleton instance
export const jwtService = new JWTService();