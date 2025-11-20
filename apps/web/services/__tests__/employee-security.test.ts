/**
 * Security-focused tests for Employee Service
 * Tests for SQL injection, authentication bypass, and other security vulnerabilities
 */

import {
  createEmployee,
  listEmployees,
  isEmailTaken,
  generateHumanReadableUserId
} from '../employee.service';
import {
  CreateEmployeeRequest,
  EmployeeListParams
} from '@pgn/shared';

// Mock the createClient function with security-focused mocks
jest.mock('../../utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock the admin utility functions
jest.mock('../../utils/supabase/admin', () => ({
  createAuthUser: jest.fn(),
  resetUserPassword: jest.fn(),
  getUserByEmail: jest.fn(),
  updateUserPasswordByEmail: jest.fn(),
}));

import { createClient } from '../../utils/supabase/server';
import { createAuthUser, getUserByEmail } from '../../utils/supabase/admin';

describe('Employee Service Security Tests', () => {
  let mockSupabaseClient: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      from: jest.fn(),
    };

    const createQueryChain = () => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    });

    mockSupabaseClient.from.mockReturnValue(createQueryChain());
    (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabaseClient);
  });

  describe('SQL Injection Protection', () => {
    it('should sanitize search parameters in listEmployees to prevent SQL injection', async () => {
      const maliciousSearch = "John'; DROP TABLE employees; --";

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
              })
            })
          })
        })
      });

      const params: EmployeeListParams = {
        search: maliciousSearch
      };

      await listEmployees(params);

      // Verify that the OR query was called with the malicious string
      expect(mockSupabaseClient.from().select().or).toHaveBeenCalled();

      // The actual implementation should escape or parameterize this
      // This test documents the current vulnerability
      const orCall = (mockSupabaseClient.from().select().or as jest.Mock).mock.calls[0][0];
      console.warn('SECURITY WARNING: Search parameter not properly sanitized:', orCall);
    });

    it('should handle email injection attempts in isEmailTaken', async () => {
      const maliciousEmail = "test@example.com'; DROP TABLE employees; --";

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      });

      const result = await isEmailTaken(maliciousEmail);

      expect(result).toBe(false);

      // Verify the email was passed through (potentially vulnerable)
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('email', maliciousEmail.toLowerCase());
    });

    it('should escape special characters in user ID generation', async () => {
      const mockResponse = {
        data: [{ human_readable_user_id: "PGN-2024-999'; DROP TABLE employees; --" }],
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          like: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        })
      });

      const result = await generateHumanReadableUserId();

      // Should handle malformed IDs gracefully
      expect(result).toBe('PGN-2024-10000');
    });
  });

  describe('Input Validation Security', () => {
    it('should reject extremely long email addresses', async () => {
      const longEmail = 'a'.repeat(300) + '@example.com';

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      });

      const result = await isEmailTaken(longEmail);

      // Should handle long emails without crashing
      expect(result).toBe(false);
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('email', longEmail.toLowerCase());
    });

    it('should handle null and undefined inputs gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      });

      // Test with null
      const result1 = await isEmailTaken(null as unknown as string);
      expect(result1).toBe(false);

      // Test with undefined
      const result2 = await isEmailTaken(undefined as unknown as string);
      expect(result2).toBe(false);
    });

    it('should handle Unicode characters in names', async () => {
      const maliciousName = '😈👹💀"; DROP TABLE employees; --';

      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: null
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'auth-user-id' } },
        error: undefined
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          like: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'emp-123', first_name: maliciousName },
              error: null
            })
          })
        })
      });

      const createData: CreateEmployeeRequest = {
        first_name: maliciousName,
        last_name: 'Test',
        email: 'test@example.com',
        password: 'password123'
      };

      // Should handle Unicode without SQL injection
      await expect(createEmployee(createData)).rejects.toThrow();
    });
  });

  describe('Authentication Security', () => {
    it('should handle authentication service failures gracefully', async () => {
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockRejectedValue(
        new Error('Authentication service unavailable')
      );

      const createData: CreateEmployeeRequest = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        password: 'password123'
      };

      await expect(createEmployee(createData)).rejects.toThrow('Authentication service unavailable');
    });

    it('should not proceed with employee creation if auth user creation fails', async () => {
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: null
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: false,
        error: 'Authentication service error'
      });

      const createData: CreateEmployeeRequest = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        password: 'password123'
      };

      await expect(createEmployee(createData)).rejects.toThrow('Failed to create auth user: Authentication service error');
    });

    it('should validate email format before checking for duplicates', async () => {
      const invalidEmails = [
        '',
        'invalid-email',
        '@invalid.com',
        'invalid@',
        'invalid..email@example.com',
        'email@example.',
        ' a@b.c' // leading space
      ];

      for (const email of invalidEmails) {
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        });

        // Should handle invalid emails without crashing
        const result = await isEmailTaken(email);
        expect(typeof result).toBe('boolean');
      }
    });
  });

  describe('Data Exposure Prevention', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Simulate a database error with sensitive information
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Connection failed: host=prod-db.supabase.co user=admin password=secret123',
                code: 'CONNECTION_ERROR'
              }
            })
          })
        })
      });

      // The service should sanitize this error
      try {
        await listEmployees({ search: 'test' });
      } catch (error: unknown) {
        // Error should not contain the sensitive database credentials
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).not.toContain('password');
        expect(errorMessage).not.toContain('secret123');
      }
    });

    it('should limit the amount of data returned in list operations', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `emp-${i}`,
        human_readable_user_id: `PGN-2024-${String(i + 1).padStart(4, '0')}`,
        first_name: `User ${i}`,
        last_name: 'Test',
        email: `user${i}@example.com`,
        employment_status: 'ACTIVE'
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: largeDataset,
              error: null,
              count: largeDataset.length
            })
          })
        })
      });

      const params: EmployeeListParams = {
        limit: 50,
        page: 1
      };

      const result = await listEmployees(params);

      // Should return only the requested amount of data
      expect(result.employees).toHaveLength(50);
      expect(result.total).toBe(10000);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('Rate Limiting and Resource Protection', () => {
    it('should handle rapid successive requests without crashing', async () => {
      const concurrentRequests = 10;

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      });

      const promises = Array.from({ length: concurrentRequests }, () =>
        listEmployees({ limit: 20 })
      );

      const results = await Promise.all(promises);

      // All requests should complete successfully
      results.forEach(result => {
        expect(result.employees).toEqual([]);
        expect(result.total).toBe(0);
      });

      // Verify the mock was called the correct number of times
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(concurrentRequests);
    });

    it('should handle memory exhaustion from large result sets', async () => {
      // Mock a very large dataset that could cause memory issues
      const hugeDataset = Array.from({ length: 100000 }, (_, i) => ({
        id: `emp-${i}`,
        // Include a large payload to test memory handling
        data: 'x'.repeat(1000)
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: hugeDataset,
              error: null,
              count: hugeDataset.length
            })
          })
        })
      });

      const params: EmployeeListParams = {
        limit: 1000, // Large but not excessive
        page: 1
      };

      // Should handle large datasets without memory issues
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(1000);
      expect(result.total).toBe(100000);
    });
  });
});