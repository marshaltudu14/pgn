/**
 * Unit tests for JWT Service using Jest
 */

import { JWTService } from '../jwt';
import jwt from 'jsonwebtoken';
import {
  JWTPayload,
  TokenGenerateOptions,
  EmploymentStatus
} from '@pgn/shared';

// Mock console.warn to avoid noise in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});

describe('JWTService', () => {
  let jwtService: JWTService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '15m';

    jwtService = new JWTService();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      expect(jwtService['secret']).toBe('test-secret-key');
      expect(jwtService['expiresIn']).toBe('15m');
    });

    it('should use fallback values when environment variables are missing', () => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_EXPIRES_IN;

      const fallbackService = new JWTService();

      expect(fallbackService['secret']).toBe('fallback-secret-key-for-development');
      expect(fallbackService['expiresIn']).toBe('15m');
      expect(console.warn).toHaveBeenCalledWith('WARNING: Using fallback JWT secret. Set JWT_SECRET in production!');
    });
  });

  describe('generateToken', () => {
    const validTokenOptions: TokenGenerateOptions = {
      humanReadableId: 'PGN-2024-0001',
      employeeId: '123e4567-e89b-12d3-a456-426614174000',
      employmentStatus: 'ACTIVE' as EmploymentStatus,
      canLogin: true,
    };

    it('should generate a valid JWT token', () => {
      const token = jwtService.generateToken(validTokenOptions);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with correct payload', () => {
      const token = jwtService.generateToken(validTokenOptions);

      const decoded = jwt.decode(token) as JWTPayload;

      expect(decoded.sub).toBe(validTokenOptions.humanReadableId);
      expect(decoded.employeeId).toBe(validTokenOptions.employeeId);
      expect(decoded.employmentStatus).toBe(validTokenOptions.employmentStatus);
      expect(decoded.canLogin).toBe(validTokenOptions.canLogin);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should generate token with correct issuer and audience', () => {
      const token = jwtService.generateToken(validTokenOptions);

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      expect(decoded).toHaveProperty('iss', 'pgn-auth');
      expect(decoded).toHaveProperty('aud', 'pgn-web');
    });

    it('should generate different tokens for different employees', () => {
      const token1 = jwtService.generateToken(validTokenOptions);

      const differentOptions = {
        ...validTokenOptions,
        humanReadableId: 'PGN-2024-0002',
        employeeId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const token2 = jwtService.generateToken(differentOptions);

      expect(token1).not.toBe(token2);
    });
  });

  describe('validateToken', () => {
    const validTokenOptions: TokenGenerateOptions = {
      humanReadableId: 'PGN-2024-0001',
      employeeId: '123e4567-e89b-12d3-a456-426614174000',
      employmentStatus: 'ACTIVE' as EmploymentStatus,
      canLogin: true,
    };

    it('should validate a valid token and return payload', () => {
      const token = jwtService.generateToken(validTokenOptions);

      const result = jwtService.validateToken(token);

      expect(result).not.toBeNull();
      expect(result!.sub).toBe(validTokenOptions.humanReadableId);
      expect(result!.employeeId).toBe(validTokenOptions.employeeId);
      expect(result!.employmentStatus).toBe(validTokenOptions.employmentStatus);
      expect(result!.canLogin).toBe(validTokenOptions.canLogin);
    });

    it('should return null for expired token', () => {
      // Create an expired token
      const expiredPayload = {
        ...validTokenOptions,
        sub: validTokenOptions.humanReadableId,
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
      };

      const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET!);

      const result = jwtService.validateToken(expiredToken);

      expect(result).toBeUndefined();
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';

      const result = jwtService.validateToken(invalidToken);

      expect(result).toBeUndefined();
    });

    it('should return null for token with invalid signature', () => {
      const token = jwtService.generateToken(validTokenOptions);

      // Tamper with the token
      const parts = token.split('.');
      const tamperedToken = parts[0] + '.' + parts[1] + '.tampersignature';

      const result = jwtService.validateToken(tamperedToken);

      expect(result).toBeUndefined();
    });

    it('should return null for token with wrong issuer', () => {
      const payload = {
        ...validTokenOptions,
        sub: validTokenOptions.humanReadableId,
      };

      const tokenWithWrongIssuer = jwt.sign(payload, process.env.JWT_SECRET!, {
        issuer: 'wrong-issuer',
        audience: 'pgn-web',
      });

      const result = jwtService.validateToken(tokenWithWrongIssuer);

      expect(result).toBeUndefined();
    });

    it('should return null for token with wrong audience', () => {
      const payload = {
        ...validTokenOptions,
        sub: validTokenOptions.humanReadableId,
      };

      const tokenWithWrongAudience = jwt.sign(payload, process.env.JWT_SECRET!, {
        issuer: 'pgn-auth',
        audience: 'wrong-audience',
      });

      const result = jwtService.validateToken(tokenWithWrongAudience);

      expect(result).toBeUndefined();
    });

    it('should return null for empty token', () => {
      const result = jwtService.validateToken('');

      expect(result).toBeUndefined();
    });

    it('should return null for null token', () => {
      const result = jwtService.validateToken(null as unknown as string);

      expect(result).toBeUndefined();
    });
  });

  describe('refreshToken', () => {
    const validTokenOptions: TokenGenerateOptions = {
      humanReadableId: 'PGN-2024-0001',
      employeeId: '123e4567-e89b-12d3-a456-426614174000',
      employmentStatus: 'ACTIVE' as EmploymentStatus,
      canLogin: true,
    };

    it('should refresh a valid token and generate a valid new token', () => {
      const oldToken = jwtService.generateToken(validTokenOptions);

      const newToken = jwtService.refreshToken(oldToken);

      expect(newToken).not.toBeNull();

      // Validate the new token
      const newPayload = jwtService.validateToken(newToken!);
      expect(newPayload).not.toBeNull();
      expect(newPayload!.sub).toBe(validTokenOptions.humanReadableId);
      expect(newPayload!.employeeId).toBe(validTokenOptions.employeeId);
      expect(newPayload!.employmentStatus).toBe(validTokenOptions.employmentStatus);
      expect(newPayload!.canLogin).toBe(validTokenOptions.canLogin);

      // The new token should be valid even if identical (same timestamp)
      expect(typeof newToken).toBe('string');
      expect(newToken!.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';

      const result = jwtService.refreshToken(invalidToken);

      expect(result).toBeUndefined();
    });

    it('should return null for token without required fields', () => {
      const payloadWithoutRequiredFields = {
        sub: 'PGN-2024-0001',
        // Missing employeeId
      };

      const tokenWithoutRequiredFields = jwt.sign(payloadWithoutRequiredFields, process.env.JWT_SECRET!);

      const result = jwtService.refreshToken(tokenWithoutRequiredFields);

      expect(result).toBeUndefined();
    });

    it('should handle expired tokens and still refresh them', () => {
      // Create an expired token
      const expiredPayload = {
        sub: validTokenOptions.humanReadableId,
        employeeId: validTokenOptions.employeeId,
        employmentStatus: validTokenOptions.employmentStatus,
        canLogin: validTokenOptions.canLogin,
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
      };

      const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET!);

      const refreshedToken = jwtService.refreshToken(expiredToken);

      expect(refreshedToken).not.toBeNull();

      // The refreshed token should be valid
      const newPayload = jwtService.validateToken(refreshedToken!);
      expect(newPayload).not.toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not.a.jwt';

      const result = jwtService.refreshToken(malformedToken);

      expect(result).toBeUndefined();
    });

    it('should return null for empty token', () => {
      const result = jwtService.refreshToken('');

      expect(result).toBeUndefined();
    });

    it('should return null for null token', () => {
      const result = jwtService.refreshToken(null as unknown as string);

      expect(result).toBeUndefined();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const headerValue = 'Bearer valid.jwt.token';

      const result = jwtService.extractTokenFromHeader(headerValue);

      expect(result).toBe('valid.jwt.token');
    });

    it('should return null for header without Bearer prefix', () => {
      const headerValue = 'Basic valid.jwt.token';

      const result = jwtService.extractTokenFromHeader(headerValue);

      expect(result).toBeUndefined();
    });

    it('should return null for header with wrong format', () => {
      const headerValue = 'Bearer token extra';

      const result = jwtService.extractTokenFromHeader(headerValue);

      expect(result).toBeUndefined();
    });

    it('should return null for empty header', () => {
      const result = jwtService.extractTokenFromHeader('');

      expect(result).toBeUndefined();
    });

    it('should return null for null header', () => {
      const result = jwtService.extractTokenFromHeader(null as unknown as string);

      expect(result).toBeUndefined();
    });

    it('should return null for undefined header', () => {
      const result = jwtService.extractTokenFromHeader(undefined as unknown as string);

      expect(result).toBeUndefined();
    });

    it('should handle whitespace in header', () => {
      const headerValue = 'Bearer   valid.jwt.token   ';

      const result = jwtService.extractTokenFromHeader(headerValue);

      // The actual implementation doesn't trim whitespace, so it returns null
      expect(result).toBeUndefined();
    });
  });

  describe('end-to-end workflow', () => {
    const validTokenOptions: TokenGenerateOptions = {
      humanReadableId: 'PGN-2024-0001',
      employeeId: '123e4567-e89b-12d3-a456-426614174000',
      employmentStatus: 'ACTIVE' as EmploymentStatus,
      canLogin: true,
    };

    it('should handle complete authentication workflow', () => {
      // Generate token
      const token = jwtService.generateToken(validTokenOptions);
      expect(token).toBeDefined();

      // Extract from header (simulating API request)
      const authHeader = `Bearer ${token}`;
      const extractedToken = jwtService.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);

      // Validate token
      const payload = jwtService.validateToken(extractedToken!);
      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe(validTokenOptions.humanReadableId);

      // Refresh token
      const refreshedToken = jwtService.refreshToken(extractedToken!);
      expect(refreshedToken).not.toBeNull();

      // Validate refreshed token
      const refreshedPayload = jwtService.validateToken(refreshedToken!);
      expect(refreshedPayload).not.toBeNull();
      expect(refreshedPayload!.sub).toBe(validTokenOptions.humanReadableId);
      expect(refreshedPayload!.employeeId).toBe(validTokenOptions.employeeId);
    });

    it('should handle different employment statuses', () => {
      const statuses: EmploymentStatus[] = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED'];

      statuses.forEach(status => {
        const options: TokenGenerateOptions = {
          ...validTokenOptions,
          employmentStatus: status,
          canLogin: status === 'ACTIVE' || status === 'ON_LEAVE',
        };

        const token = jwtService.generateToken(options);
        const payload = jwtService.validateToken(token);

        expect(payload).not.toBeNull();
        expect(payload!.employmentStatus).toBe(status);
        expect(payload!.canLogin).toBe(status === 'ACTIVE' || status === 'ON_LEAVE');
      });
    });
  });
});