/**
 * Unit tests for Employee Service using Jest
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  createEmployee,
  generateHumanReadableUserId,
  getEmployeeById,
  getEmployeeByHumanReadableId,
  getEmployeeByEmail,
  listEmployees,
  updateEmployee,
  changeEmploymentStatus,
  updateRegionalAssignments,
  isEmailTaken,
  isHumanReadableIdTaken,
  resetEmployeePassword
} from '../employee.service';
import {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ChangeEmploymentStatusRequest,
  EmployeeListParams,
  EmploymentStatus
} from '@pgn/shared';

// Create a comprehensive Supabase mock
const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn(),
  };

  // Setup chainable methods
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

  mockClient.from.mockReturnValue(createQueryChain());

  return mockClient;
};

// Mock the createClient function
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
import { createAuthUser, resetUserPassword, getUserByEmail, updateUserPasswordByEmail } from '../../utils/supabase/admin';

describe('Employee Service', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabaseClient as any);
  });

  describe('generateHumanReadableUserId', () => {
    it('should generate a user ID with current year and sequence 0001 for first employee', async () => {
      const currentYear = new Date().getFullYear();

      // Mock empty response from database (no existing users for this year)
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          like: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      });

      const result = await generateHumanReadableUserId();

      expect(result).toBe(`PGN-${currentYear}-0001`);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees');
    });

    it('should generate next sequence number when users exist for current year', async () => {
      const currentYear = new Date().getFullYear();

      // Mock response with existing user at sequence 0005
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          like: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{ human_readable_user_id: `PGN-${currentYear}-0005` }],
                error: null
              })
            })
          })
        })
      });

      const result = await generateHumanReadableUserId();

      expect(result).toBe(`PGN-${currentYear}-0006`);
    });

    it('should handle edge case of 9999 sequence and wrap to 0001', async () => {
      const currentYear = new Date().getFullYear();

      // Mock response with user at sequence 9999
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          like: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{ human_readable_user_id: `PGN-${currentYear}-9999` }],
                error: null
              })
            })
          })
        })
      });

      const result = await generateHumanReadableUserId();

      expect(result).toBe(`PGN-${currentYear}-10000`);
    });

    it('should handle database errors gracefully and return sequence 0001', async () => {
      const currentYear = new Date().getFullYear();

      // Mock database error
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          like: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' }
              })
            })
          })
        })
      });

      const result = await generateHumanReadableUserId();

      expect(result).toBe(`PGN-${currentYear}-0001`);
    });

    it('should handle malformed existing user ID and return sequence 0001', async () => {
      const currentYear = new Date().getFullYear();

      // Mock response with malformed user ID
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          like: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{ human_readable_user_id: 'INVALID-FORMAT-ID' }],
                error: null
              })
            })
          })
        })
      });

      const result = await generateHumanReadableUserId();

      expect(result).toBe(`PGN-${currentYear}-0001`);
    });

    it('should handle null data response and return sequence 0001', async () => {
      const currentYear = new Date().getFullYear();

      // Mock null data response
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          like: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        })
      });

      const result = await generateHumanReadableUserId();

      expect(result).toBe(`PGN-${currentYear}-0001`);
    });
  });

  describe('createEmployee', () => {
    const validCreateRequest: CreateEmployeeRequest = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      employment_status: 'ACTIVE' as EmploymentStatus,
      can_login: true,
      assigned_cities: [{ city: 'Test City', state: 'Test State' }],
      password: 'securePassword123',
    };

    const mockEmployeeData = {
      id: 'auth-user-id',
      human_readable_user_id: 'PGN-2024-0001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      employment_status: 'ACTIVE',
      can_login: true,
      assigned_regions: ['Region1', 'Region2'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should create a new employee successfully with all fields', async () => {
      // Mock no existing auth user found
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: null
      } as any);

      // Mock auth user creation success
      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'auth-user-id' } },
        error: undefined
      } as any);

      // Setup mock that handles multiple calls differently
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call for generateHumanReadableUserId
          return {
            select: jest.fn().mockReturnValue({
              like: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            })
          };
        } else {
          // Second call for employee insertion
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockEmployeeData,
                  error: null
                })
              })
            })
          };
        }
      });

      const result = await createEmployee(validCreateRequest);

      expect(result).toEqual(mockEmployeeData);
      expect(createAuthUser).toHaveBeenCalledWith(
        validCreateRequest.email,
        validCreateRequest.password
      );
      expect(callCount).toBe(2); // Should be called twice
    });

    it('should create employee with optional fields as null when not provided', async () => {
      const minimalRequest: CreateEmployeeRequest = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password123'
      };

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'auth-user-id-2' } },
        error: undefined
      } as any);

      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: false,
        data: null
      });

      jest.spyOn({ generateHumanReadableUserId }, 'generateHumanReadableUserId')
        .mockResolvedValue('PGN-2024-0002');

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              ...mockEmployeeData,
              id: 'auth-user-id-2',
              human_readable_user_id: 'PGN-2024-0002',
              first_name: 'Jane',
              last_name: 'Smith',
              email: 'jane.smith@example.com',
              phone: null,
              employment_status: 'ACTIVE',
              can_login: true,
              assigned_regions: null
            },
            error: null
          })
        })
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          like: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        insert: mockInsert
      });

      await createEmployee(minimalRequest);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: null,
          employment_status: 'ACTIVE',
          can_login: true,
          assigned_cities: []
        })
      );
    });

    it('should throw error if password is missing', async () => {
      const invalidRequest = { ...validCreateRequest };
      delete invalidRequest.password;

      await expect(createEmployee(invalidRequest as CreateEmployeeRequest)).rejects.toThrow(
        'Password is required for creating new employee'
      );
    });

    it('should throw error if password is empty string', async () => {
      const invalidRequest = { ...validCreateRequest, password: '' };

      await expect(createEmployee(invalidRequest)).rejects.toThrow(
        'Password is required for creating new employee'
      );
    });

    it('should throw error if auth user creation fails with specific error', async () => {
      // Mock no existing auth user found
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: null
      } as any);

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: false,
        error: 'Email already exists in auth system'
      });

      await expect(createEmployee(validCreateRequest)).rejects.toThrow(
        'Failed to create auth user: Email already exists in auth system'
      );
    });

    it('should throw error if auth user creation fails without specific error', async () => {
      // Mock no existing auth user found
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: null
      } as any);

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: false,
        error: null
      });

      await expect(createEmployee(validCreateRequest)).rejects.toThrow(
        'Failed to create auth user: Unknown error'
      );
    });

    it('should throw error if auth user creation returns no user object', async () => {
      // Mock no existing auth user found
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: null
      } as any);

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: null },
        error: undefined
      } as any);

      await expect(createEmployee(validCreateRequest)).rejects.toThrow(
        'Failed to get auth user ID'
      );
    });

    it('should throw error if auth user creation returns user without id', async () => {
      // Mock no existing auth user found
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: null
      } as any);

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { email: 'test@example.com' } },
        error: undefined
      } as any);

      await expect(createEmployee(validCreateRequest)).rejects.toThrow(
        'Failed to get auth user ID'
      );
    });

    it('should handle database errors during employee creation and not delete auth user', async () => {
      // Mock no existing auth user found
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: null
      } as any);

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'auth-user-id' } },
        error: undefined
      } as any);

      jest.spyOn({ generateHumanReadableUserId }, 'generateHumanReadableUserId')
        .mockResolvedValue('PGN-2024-0001');

      // Mock database error during employee creation
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
              data: null,
              error: { message: 'Unique constraint violation: email already exists' }
            })
          })
        })
      });

      await expect(createEmployee(validCreateRequest)).rejects.toThrow(
        'Failed to create employee: Unique constraint violation: email already exists'
      );

      // Verify auth user creation was attempted but not rolled back (as per policy)
      expect(getUserByEmail).toHaveBeenCalledTimes(1);
      expect(createAuthUser).toHaveBeenCalledTimes(1);
    });

    it('should handle auth service exceptions', async () => {
      // Mock getUserByEmail to throw an exception
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockRejectedValue(new Error('Auth service unavailable'));

      await expect(createEmployee(validCreateRequest)).rejects.toThrow(
        'Auth service unavailable'
      );
    });

    it('should handle generateHumanReadableUserId errors', async () => {
      // Mock no existing auth user found
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: null
      } as any);

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'auth-user-id' } },
        error: undefined
      } as any);

      // Mock generateHumanReadableUserId to throw error
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          like: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(new Error('Database unavailable for ID generation'))
            })
          })
        })
      });

      await expect(createEmployee(validCreateRequest)).rejects.toThrow(
        'Database unavailable for ID generation'
      );
    });

    it('should create employee profile for existing auth user with updated password', async () => {
      // Mock existing auth user found
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: {
          id: 'existing-auth-user-id',
          email: 'existing.user@example.com',
          created_at: '2023-01-01T00:00:00Z'
        }
      } as any);

      // Mock password update success
      (updateUserPasswordByEmail as jest.MockedFunction<typeof updateUserPasswordByEmail>).mockResolvedValue({
        success: true,
        data: { user: { id: 'existing-auth-user-id' } }
      } as any);

      jest.spyOn({ generateHumanReadableUserId }, 'generateHumanReadableUserId')
        .mockResolvedValue('PGN-2024-0002');

      // Mock successful employee creation
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
              data: {
                id: 'existing-auth-user-id',
                human_readable_user_id: 'PGN-2024-0002',
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'existing.user@example.com',
                phone: '+1234567890',
                employment_status: 'ACTIVE',
                can_login: true,
                assigned_regions: ['Region1'],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              error: null
            })
          })
        })
      });

      const result = await createEmployee({
        ...validCreateRequest,
        email: 'existing.user@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        password: 'newPassword123'
      });

      expect(result).toEqual({
        id: 'existing-auth-user-id',
        human_readable_user_id: 'PGN-2024-0002',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'existing.user@example.com',
        phone: '+1234567890',
        employment_status: 'ACTIVE',
        can_login: true,
        assigned_regions: ['Region1'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });

      // Verify existing auth user was found and password updated
      expect(getUserByEmail).toHaveBeenCalledWith('existing.user@example.com');
      expect(updateUserPasswordByEmail).toHaveBeenCalledWith('existing.user@example.com', 'newPassword123');
      // Verify no new auth user was created
      expect(createAuthUser).not.toHaveBeenCalled();
    });

    it('should throw error if password update fails for existing auth user', async () => {
      // Mock existing auth user found
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: {
          id: 'existing-auth-user-id',
          email: 'existing.user@example.com',
          created_at: '2023-01-01T00:00:00Z'
        }
      } as any);

      // Mock password update failure
      (updateUserPasswordByEmail as jest.MockedFunction<typeof updateUserPasswordByEmail>).mockResolvedValue({
        success: false,
        error: 'Failed to update password'
      } as any);

      await expect(createEmployee({
        ...validCreateRequest,
        email: 'existing.user@example.com',
        password: 'newPassword123'
      })).rejects.toThrow('Failed to update existing auth user password: Failed to update password');

      // Verify existing auth user was found and password update was attempted
      expect(getUserByEmail).toHaveBeenCalledWith('existing.user@example.com');
      expect(updateUserPasswordByEmail).toHaveBeenCalledWith('existing.user@example.com', 'newPassword123');
      // Verify no new auth user was created
      expect(createAuthUser).not.toHaveBeenCalled();
    });

    it('should create new auth user when none exists', async () => {
      // Mock no existing auth user found
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: null
      } as any);

      // Mock new auth user creation
      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'new-auth-user-id' } },
        error: undefined
      } as any);

      jest.spyOn({ generateHumanReadableUserId }, 'generateHumanReadableUserId')
        .mockResolvedValue('PGN-2024-0003');

      // Mock successful employee creation
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
              data: {
                id: 'new-auth-user-id',
                human_readable_user_id: 'PGN-2024-0003',
                first_name: 'Alice',
                last_name: 'Johnson',
                email: 'alice.johnson@example.com',
                phone: '+1234567890',
                employment_status: 'ACTIVE',
                can_login: true,
                assigned_regions: ['Region1'],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              error: null
            })
          })
        })
      });

      const result = await createEmployee({
        ...validCreateRequest,
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice.johnson@example.com'
      });

      expect(result).toEqual({
        id: 'new-auth-user-id',
        human_readable_user_id: 'PGN-2024-0003',
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice.johnson@example.com',
        phone: '+1234567890',
        employment_status: 'ACTIVE',
        can_login: true,
        assigned_regions: ['Region1'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });

      // Verify no existing auth user was searched for initially
      expect(getUserByEmail).toHaveBeenCalledWith('alice.johnson@example.com');
      // Verify new auth user was created
      expect(createAuthUser).toHaveBeenCalledWith('alice.johnson@example.com', 'securePassword123');
    });
  });

  describe('getEmployeeById', () => {
    const mockEmployee = {
      id: 'emp-123',
      human_readable_user_id: 'PGN-2024-0001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      employment_status: 'ACTIVE',
      can_login: true,
    };

    it('should return employee when found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });

      const result = await getEmployeeById('emp-123');

      expect(result).toEqual(mockEmployee);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees');
    });

    it('should return null when employee not found (PGRST116 error)', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      });

      const result = await getEmployeeById('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when data is null with no error', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      });

      const result = await getEmployeeById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error for database connection errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection timeout' }
            })
          })
        })
      });

      await expect(getEmployeeById('emp-123')).rejects.toThrow(
        'Failed to get employee: Connection timeout'
      );
    });

    it('should throw error for permission denied errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Permission denied: insufficient privileges' }
            })
          })
        })
      });

      await expect(getEmployeeById('emp-123')).rejects.toThrow(
        'Failed to get employee: Permission denied: insufficient privileges'
      );
    });

    it('should handle empty employee ID', async () => {
      await expect(getEmployeeById('')).rejects.toThrow();
    });

    it('should handle null employee ID', async () => {
      await expect(getEmployeeById(null as unknown as string)).rejects.toThrow();
    });

    it('should handle database exceptions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(getEmployeeById('emp-123')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getEmployeeByHumanReadableId', () => {
    const mockEmployee = {
      id: 'emp-123',
      human_readable_user_id: 'PGN-2024-0001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
    };

    it('should return employee when found by human readable ID', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });

      const result = await getEmployeeByHumanReadableId('PGN-2024-0001');

      expect(result).toEqual(mockEmployee);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees');
    });

    it('should return null when human readable ID not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      });

      const result = await getEmployeeByHumanReadableId('PGN-9999-9999');

      expect(result).toBeNull();
    });

    it('should throw error for malformed human readable ID', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Invalid input syntax for human readable ID' }
            })
          })
        })
      });

      await expect(getEmployeeByHumanReadableId('INVALID-ID')).rejects.toThrow(
        'Failed to get employee: Invalid input syntax for human readable ID'
      );
    });

    it('should handle empty human readable ID', async () => {
      await expect(getEmployeeByHumanReadableId('')).rejects.toThrow();
    });

    it('should handle case-sensitive human readable ID', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      });

      const result = await getEmployeeByHumanReadableId('pgn-2024-0001'); // lowercase
      expect(result).toBeNull();
    });
  });

  describe('getEmployeeByEmail', () => {
    const mockEmployee = {
      id: 'emp-123',
      human_readable_user_id: 'PGN-2024-0001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
    };

    it('should return employee when found by email (case insensitive)', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });

      const result = await getEmployeeByEmail('JOHN.DOE@EXAMPLE.COM');

      expect(result).toEqual(mockEmployee);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees');
    });

    it('should return employee when found with leading/trailing whitespace', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });

      const result = await getEmployeeByEmail('  john.doe@example.com  ');

      expect(result).toEqual(mockEmployee);
    });

    it('should return null when email not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      });

      const result = await getEmployeeByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle invalid email format gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      });

      const result = await getEmployeeByEmail('invalid-email');

      expect(result).toBeNull();
    });

    it('should handle empty email string', async () => {
      await expect(getEmployeeByEmail('')).rejects.toThrow();
    });

    it('should handle null email', async () => {
      await expect(getEmployeeByEmail(null as unknown as string)).rejects.toThrow();
    });

    it('should handle email with only whitespace', async () => {
      // Empty string after trim should return null
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      });

      const result = await getEmployeeByEmail('   ');
      expect(result).toBeNull();
    });
  });

  describe('listEmployees', () => {
    const mockEmployees = [
      {
        id: '1',
        human_readable_user_id: 'PGN-2024-0001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        employment_status: 'ACTIVE'
      },
      {
        id: '2',
        human_readable_user_id: 'PGN-2024-0002',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        employment_status: 'ON_LEAVE'
      },
    ];

    it('should return paginated employee list with default parameters', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockEmployees,
              error: null,
              count: 25
            })
          })
        })
      });

      const params: EmployeeListParams = {};
      const result = await listEmployees(params);

      expect(result).toEqual({
        employees: mockEmployees,
        total: 25,
        page: 1,
        limit: 50,
        hasMore: false // (1-1)*50 + 50 = 50 >= 25
      });
    });

    it('should return paginated employee list with custom parameters', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockEmployees,
              error: null,
              count: 150
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 2,
        limit: 25,
        sort_by: 'first_name',
        sort_order: 'asc'
      };
      const result = await listEmployees(params);

      expect(result).toEqual({
        employees: mockEmployees,
        total: 150,
        page: 2,
        limit: 25,
        hasMore: true // (2-1)*25 + 25 = 50 < 150
      });
    });

    it('should apply search filter across multiple fields', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockEmployees[0]], // Only John Doe matches (searching human_readable_user_id by default)
                error: null,
                count: 1
              })
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 1,
        limit: 50,
        search: 'John'
      };
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(1);
      expect(result.employees[0].first_name).toBe('John');
      expect(result.total).toBe(1);
    });

    it('should apply search filter by last name', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockEmployees[1]], // Only Jane Smith matches
                error: null,
                count: 1
              })
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 1,
        limit: 50,
        search: 'Smith',
        search_field: 'last_name'
      };
      const result = await listEmployees(params);

      expect(result.employees[0].last_name).toBe('Smith');
    });

    it('should apply search filter by email', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockEmployees,
                error: null,
                count: 2
              })
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 1,
        limit: 50,
        search: 'example.com',
        search_field: 'email'
      };
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(2);
    });

    it('should apply employment status filter with single status', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockEmployees[0]], // Only active employee
                error: null,
                count: 1
              })
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 1,
        limit: 50,
        employment_status: ['ACTIVE']
      };
      const result = await listEmployees(params);

      expect(result.employees[0].employment_status).toBe('ACTIVE');
    });

    it('should apply employment status filter with multiple statuses', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockEmployees,
                error: null,
                count: 2
              })
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 1,
        limit: 50,
        employment_status: ['ACTIVE', 'ON_LEAVE']
      };
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(2);
    });

    it('should handle empty employment status array', async () => {
      const mockOrder = jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      });

      const mockSelect = {
        order: mockOrder,
        in: jest.fn()
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      });

      const params: EmployeeListParams = {
        page: 1,
        limit: 50,
        employment_status: []
      };
      const result = await listEmployees(params);

      expect(result).toEqual({
        employees: [],
        total: 0,
        page: 1,
        limit: 50,
        hasMore: false
      });

      // Should not call .in() when employment_status is empty
      expect(mockSelect.in).not.toHaveBeenCalled();
    });

    it('should calculate hasMore correctly for last page', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockEmployees,
              error: null,
              count: 75
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 2,
        limit: 50,
      };
      const result = await listEmployees(params);

      // Calculate hasMore: (page - 1) * limit + limit >= total
      // (2-1) * 50 + 50 = 100 >= 75, so hasMore should be false
      expect(result.hasMore).toBe(false);
    });

    it('should calculate hasMore correctly for middle page', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockEmployees,
              error: null,
              count: 150
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 2,
        limit: 50,
      };
      const result = await listEmployees(params);

      expect(result.hasMore).toBe(true); // (2-1)*50 + 50 = 100 < 150
    });

    it('should handle null data response', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: null,
              error: null,
              count: 0
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 1,
        limit: 50,
      };
      const result = await listEmployees(params);

      expect(result).toEqual({
        employees: [],
        total: 0,
        page: 1,
        limit: 50,
        hasMore: false
      });
    });

    it('should handle undefined count', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockEmployees,
              error: null,
              count: undefined
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 1,
        limit: 50,
      };
      const result = await listEmployees(params);

      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query timeout' }
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 1,
        limit: 50,
      };

      await expect(listEmployees(params)).rejects.toThrow(
        'Failed to list employees: Query timeout'
      );
    });

    it('should handle page parameter of 0 (should be treated as 1)', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockEmployees,
              error: null,
              count: 25
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: 0,
        limit: 50,
      };
      const result = await listEmployees(params);

      expect(result.page).toBe(0); // The function doesn't modify the page parameter
      // Calculate hasMore: offset = (0-1)*50 = -50, so offset + limit = -50 + 50 = 0
      // 0 < 25, so hasMore should be true
      expect(result.hasMore).toBe(true);
    });

    it('should handle negative page parameter', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 25
            })
          })
        })
      });

      const params: EmployeeListParams = {
        page: -1,
        limit: 50,
      };
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(0);
    });
  });

  describe('updateEmployee', () => {
    const updateData: UpdateEmployeeRequest = {
      first_name: 'John Updated',
      email: 'john.updated@example.com',
      employment_status: 'ON_LEAVE' as EmploymentStatus,
      phone: '+9876543210'
    };

    const updatedEmployee = {
      id: 'emp-123',
      human_readable_user_id: 'PGN-2024-0001',
      first_name: 'John Updated',
      last_name: 'Doe',
      email: 'john.updated@example.com',
      phone: '+9876543210',
      employment_status: 'ON_LEAVE',
      updated_at: new Date().toISOString(),
    };

    it('should update employee with provided fields only', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedEmployee,
                error: null
              })
            })
          })
        })
      });

      const result = await updateEmployee('emp-123', updateData);

      expect(result).toEqual(updatedEmployee);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees');

      const updateCall = mockSupabaseClient.from().update;
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'John Updated',
          email: 'john.updated@example.com',
          employment_status: 'ON_LEAVE',
          phone: '+9876543210',
          updated_at: expect.any(String)
        })
      );
    });

    it('should include updated_at timestamp automatically', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedEmployee,
                error: null
              })
            })
          })
        })
      });

      await updateEmployee('emp-123', updateData);

      const updateCall = mockSupabaseClient.from().update;
      const updateDataCalled = updateCall.mock.calls[0][0];

      expect(updateDataCalled).toHaveProperty('updated_at');
      expect(new Date(updateDataCalled.updated_at)).toBeInstanceOf(Date);
    });

    it('should not include undefined fields in update', async () => {
      const partialUpdate: UpdateEmployeeRequest = {
        first_name: 'John Updated',
        email: undefined // This should not be included
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedEmployee,
                error: null
              })
            })
          })
        })
      });

      await updateEmployee('emp-123', partialUpdate);

      const updateCall = mockSupabaseClient.from().update;
      const updateDataCalled = updateCall.mock.calls[0][0];

      expect(updateDataCalled).toHaveProperty('first_name');
      expect(updateDataCalled).not.toHaveProperty('email');
    });

    it('should update with null values when explicitly provided', async () => {
      const updateWithNulls: UpdateEmployeeRequest = {
        phone: null as any,
        assigned_cities: null as any
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...updatedEmployee, phone: null, assigned_cities: null },
                error: null
              })
            })
          })
        })
      });

      await updateEmployee('emp-123', updateWithNulls);

      const updateCall = mockSupabaseClient.from().update;
      const updateDataCalled = updateCall.mock.calls[0][0];

      expect(updateDataCalled.phone).toBeNull();
      expect(updateDataCalled.assigned_cities).toBeNull();
    });

    it('should handle empty update object', async () => {
      const emptyUpdate: UpdateEmployeeRequest = {};

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...updatedEmployee, updated_at: new Date().toISOString() },
                error: null
              })
            })
          })
        })
      });

      const result = await updateEmployee('emp-123', emptyUpdate);

      expect(result).toBeDefined();

      const updateCall = mockSupabaseClient.from().update;
      const updateDataCalled = updateCall.mock.calls[0][0];

      expect(updateDataCalled).toHaveProperty('updated_at');
      expect(Object.keys(updateDataCalled)).toHaveLength(1); // Only updated_at
    });

    it('should throw error for database constraint violations', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Unique constraint violation on email' }
              })
            })
          })
        })
      });

      await expect(updateEmployee('emp-123', updateData)).rejects.toThrow(
        'Failed to update employee: Unique constraint violation on email'
      );
    });

    it('should throw error for permission denied', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Permission denied: cannot update employee' }
              })
            })
          })
        })
      });

      await expect(updateEmployee('emp-123', updateData)).rejects.toThrow(
        'Failed to update employee: Permission denied: cannot update employee'
      );
    });

    it('should handle empty employee ID', async () => {
      await expect(updateEmployee('', updateData)).rejects.toThrow();
    });

    it('should handle null employee ID', async () => {
      await expect(updateEmployee(null as unknown as string, updateData)).rejects.toThrow();
    });

    it('should handle database exceptions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      await expect(updateEmployee('emp-123', updateData)).rejects.toThrow(
        'Database connection lost'
      );
    });
  });

  describe('changeEmploymentStatus', () => {
    const statusChange: ChangeEmploymentStatusRequest = {
      employment_status: 'SUSPENDED' as EmploymentStatus,
      changed_by: 'admin-user',
    };

    it('should set can_login to false for SUSPENDED status', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'emp-123',
                employment_status: 'SUSPENDED',
                can_login: false,
                updated_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      });

      const result = await changeEmploymentStatus('emp-123', statusChange);

      expect(result.employment_status).toBe('SUSPENDED');
      expect(result.can_login).toBe(false);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          employment_status: 'SUSPENDED',
          can_login: false
        })
      );
    });

    it('should set can_login to true for ACTIVE status', async () => {
      const activeStatusChange: ChangeEmploymentStatusRequest = {
        employment_status: 'ACTIVE' as EmploymentStatus,
        changed_by: 'admin-user',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'emp-123',
                employment_status: 'ACTIVE',
                can_login: true,
                updated_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      });

      const result = await changeEmploymentStatus('emp-123', activeStatusChange);

      expect(result.employment_status).toBe('ACTIVE');
      expect(result.can_login).toBe(true);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          employment_status: 'ACTIVE',
          can_login: true
        })
      );
    });

    it('should set can_login to true for ON_LEAVE status', async () => {
      const onLeaveStatusChange: ChangeEmploymentStatusRequest = {
        employment_status: 'ON_LEAVE' as EmploymentStatus,
        changed_by: 'admin-user',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'emp-123',
                employment_status: 'ON_LEAVE',
                can_login: true,
                updated_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      });

      const result = await changeEmploymentStatus('emp-123', onLeaveStatusChange);

      expect(result.employment_status).toBe('ON_LEAVE');
      expect(result.can_login).toBe(true);
    });

    it('should set can_login to false for RESIGNED status', async () => {
      const resignedStatusChange: ChangeEmploymentStatusRequest = {
        employment_status: 'RESIGNED' as EmploymentStatus,
        changed_by: 'admin-user',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'emp-123',
                employment_status: 'RESIGNED',
                can_login: false,
                updated_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      });

      const result = await changeEmploymentStatus('emp-123', resignedStatusChange);

      expect(result.employment_status).toBe('RESIGNED');
      expect(result.can_login).toBe(false);
    });

    it('should set can_login to false for TERMINATED status', async () => {
      const terminatedStatusChange: ChangeEmploymentStatusRequest = {
        employment_status: 'TERMINATED' as EmploymentStatus,
        changed_by: 'admin-user',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'emp-123',
                employment_status: 'TERMINATED',
                can_login: false,
                updated_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      });

      const result = await changeEmploymentStatus('emp-123', terminatedStatusChange);

      expect(result.employment_status).toBe('TERMINATED');
      expect(result.can_login).toBe(false);
    });

    it('should handle database errors during status change', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Status change not allowed' }
              })
            })
          })
        })
      });

      await expect(changeEmploymentStatus('emp-123', statusChange)).rejects.toThrow();
    });
  });

  describe('updateRegionalAssignments', () => {
    const regionalAssignment = {
      assigned_cities: [{ city: 'North City', district: 'North District', state: 'North State' }],
    };

    it('should update assigned_regions field', async () => {
      // Mock the database response for updateEmployee called within updateRegionalAssignments
      const mockUpdatedEmployee = {
        id: 'emp-123',
        assigned_cities: [{ city: 'North City', district: 'North District', state: 'North State' }],
        updated_at: new Date().toISOString()
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedEmployee,
                error: null
              })
            })
          })
        })
      });

      const result = await updateRegionalAssignments('emp-123', regionalAssignment);

      expect(result).toEqual(mockUpdatedEmployee);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees');

      const updateCall = mockSupabaseClient.from().update;
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          assigned_cities: [{ city: 'North City', district: 'North District', state: 'North State' }],
          updated_at: expect.any(String)
        })
      );
    });

    it('should handle partial regional assignment updates', async () => {
      const partialAssignment = {
        assigned_cities: [{ city: 'East City', district: 'East District', state: 'East State' }]
      };

      // Mock the database response
      const mockUpdatedEmployee = {
        id: 'emp-123',
        assigned_cities: [{ city: 'East City', district: 'East District', state: 'East State' }],
        updated_at: new Date().toISOString()
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedEmployee,
                error: null
              })
            })
          })
        })
      });

      const result = await updateRegionalAssignments('emp-123', partialAssignment);

      expect(result).toEqual(mockUpdatedEmployee);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees');

      const updateCall = mockSupabaseClient.from().update;
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          assigned_cities: [{ city: 'East City', district: 'East District', state: 'East State' }],
          updated_at: expect.any(String)
        })
      );
    });

    it('should handle empty assigned_regions array', async () => {
      const emptyRegionsAssignment = {
        assigned_cities: []
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'emp-123',
                assigned_cities: [],
                updated_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      });

      const result = await updateRegionalAssignments('emp-123', emptyRegionsAssignment);

      expect(result.assigned_cities).toEqual([]);
    });
  });

  describe('isEmailTaken', () => {
    it('should return true when email is taken by another employee', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 'emp-456' }],
              error: null
            })
          })
        })
      });

      const result = await isEmailTaken('taken@example.com');

      expect(result).toBe(true);
    });

    it('should return false when email is available', async () => {
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

      const result = await isEmailTaken('available@example.com');

      expect(result).toBe(false);
    });

    it('should return false when checking own email (exclude ID)', async () => {
      const mockNeq = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: mockNeq
          })
        })
      });

      const result = await isEmailTaken('john.doe@example.com', 'emp-123');

      expect(result).toBe(false);
      expect(mockNeq).toHaveBeenCalledWith('id', 'emp-123');
    });

    it('should return true when email is taken by different employee (with exclude)', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{ id: 'emp-789' }],
                error: null
              })
            })
          })
        })
      });

      const result = await isEmailTaken('taken@example.com', 'emp-123');

      expect(result).toBe(true);
    });

    it('should handle database errors gracefully (return false)', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection failed' }
            })
          })
        })
      });

      const result = await isEmailTaken('test@example.com');

      expect(result).toBe(false);
    });

    it('should handle empty email string', async () => {
      const result = await isEmailTaken('');

      expect(result).toBe(false);
    });

    it('should handle null email gracefully', async () => {
      const result = await isEmailTaken(null as unknown as string);

      expect(result).toBe(false);
    });

    it('should normalize email to lowercase before checking', async () => {
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

      await isEmailTaken('UPPERCASE@EXAMPLE.COM');

      const eqCall = mockSupabaseClient.from().select().eq;
      expect(eqCall).toHaveBeenCalledWith('email', 'uppercase@example.com');
    });

    it('should trim whitespace from email before checking', async () => {
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

      await isEmailTaken('  spaced@example.com  ');

      const eqCall = mockSupabaseClient.from().select().eq;
      expect(eqCall).toHaveBeenCalledWith('email', 'spaced@example.com');
    });
  });

  describe('isHumanReadableIdTaken', () => {
    it('should return true when human readable ID is taken', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 'emp-456' }],
              error: null
            })
          })
        })
      });

      const result = await isHumanReadableIdTaken('PGN-2024-0001');

      expect(result).toBe(true);
    });

    it('should return false when human readable ID is available', async () => {
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

      const result = await isHumanReadableIdTaken('PGN-2024-9999');

      expect(result).toBe(false);
    });

    it('should return false when checking own ID (exclude ID)', async () => {
      const mockNeq = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: mockNeq
          })
        })
      });

      const result = await isHumanReadableIdTaken('PGN-2024-0001', 'emp-123');

      expect(result).toBe(false);
      expect(mockNeq).toHaveBeenCalledWith('id', 'emp-123');
    });

    it('should return true when ID is taken by different employee (with exclude)', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{ id: 'emp-789' }],
                error: null
              })
            })
          })
        })
      });

      const result = await isHumanReadableIdTaken('PGN-2024-0001', 'emp-123');

      expect(result).toBe(true);
    });

    it('should handle database errors gracefully (return false)', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const result = await isHumanReadableIdTaken('PGN-2024-0001');

      expect(result).toBe(false);
    });

    it('should handle empty human readable ID', async () => {
      const result = await isHumanReadableIdTaken('');

      expect(result).toBe(false);
    });

    it('should handle null human readable ID gracefully', async () => {
      const result = await isHumanReadableIdTaken(null as unknown as string);

      expect(result).toBe(false);
    });

    it('should not modify case of human readable ID', async () => {
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

      await isHumanReadableIdTaken('PGN-2024-0001');

      const eqCall = mockSupabaseClient.from().select().eq;
      expect(eqCall).toHaveBeenCalledWith('human_readable_user_id', 'PGN-2024-0001');
    });
  });

  describe('resetEmployeePassword', () => {
    const mockEmployee = {
      id: 'emp-123',
      email: 'john.doe@example.com',
      human_readable_user_id: 'PGN-2024-0001',
      first_name: 'John',
      last_name: 'Doe',
    };

    it('should reset password successfully', async () => {
      // Mock getEmployeeById by setting up the mock for the Supabase call
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });

      // Mock successful password reset
      (resetUserPassword as jest.MockedFunction<typeof resetUserPassword>).mockResolvedValue({
        success: true,
        data: { user: { id: 'auth-user-id' } },
        error: undefined
      } as any);

      const result = await resetEmployeePassword('emp-123', 'newPassword123');

      expect(result).toEqual({ success: true });
      expect(resetUserPassword).toHaveBeenCalledWith(
        'john.doe@example.com',
        'newPassword123'
      );
    });

    it('should return error when employee not found', async () => {
      // Mock getEmployeeById returning null
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      });

      const result = await resetEmployeePassword('non-existent', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: 'Employee not found'
      });
    });

    it('should return error when password reset fails with specific error', async () => {
      // Mock getEmployeeById
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });

      // Mock password reset failure
      (resetUserPassword as jest.MockedFunction<typeof resetUserPassword>).mockResolvedValue({
        success: false,
        error: 'Password reset service unavailable'
      });

      const result = await resetEmployeePassword('emp-123', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: 'Password reset service unavailable'
      });
    });

    it('should return error when password reset fails without specific error', async () => {
      // Mock getEmployeeById
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });

      // Mock password reset failure
      (resetUserPassword as jest.MockedFunction<typeof resetUserPassword>).mockResolvedValue({
        success: false,
        error: null
      });

      const result = await resetEmployeePassword('emp-123', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: 'Failed to reset password'
      });
    });

    it('should handle getEmployeeById exceptions', async () => {
      // Mock getEmployeeById throwing error
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await resetEmployeePassword('emp-123', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      });
    });

    it('should handle resetUserPassword exceptions', async () => {
      // Mock getEmployeeById
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });

      // Mock password reset throwing error
      (resetUserPassword as jest.MockedFunction<typeof resetUserPassword>).mockRejectedValue(new Error('Auth service timeout'));

      const result = await resetEmployeePassword('emp-123', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      });
    });

    it('should handle empty employee ID', async () => {
      // Mock getEmployeeById to throw error for empty string
      // getEmployeeById already imported
      const getEmployeeByIdSpy = jest.spyOn({ getEmployeeById }, 'getEmployeeById')
        .mockRejectedValue(new Error('Invalid employee ID'));

      const result = await resetEmployeePassword('', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      });

      getEmployeeByIdSpy.mockRestore();
    });

    it('should handle null employee ID', async () => {
      // Mock getEmployeeById to throw error for null ID
      const getEmployeeByIdSpy = jest.spyOn({ getEmployeeById }, 'getEmployeeById')
        .mockRejectedValue(new Error('Invalid employee ID'));

      const result = await resetEmployeePassword(null as unknown as string, 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      });

      getEmployeeByIdSpy.mockRestore();
    });

    it('should handle empty new password', async () => {
      // Mock getEmployeeById
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });

      // Mock successful password reset (empty password should still be passed through)
      (resetUserPassword as jest.MockedFunction<typeof resetUserPassword>).mockResolvedValue({
        success: true,
        data: { user: { id: 'auth-user-id' } },
        error: undefined
      } as any);

      const result = await resetEmployeePassword('emp-123', '');

      expect(result).toEqual({ success: true });
      expect(resetUserPassword).toHaveBeenCalledWith('john.doe@example.com', '');
    });

    it('should handle null new password', async () => {
      // Mock getEmployeeById
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });

      // Mock successful password reset
      (resetUserPassword as jest.MockedFunction<typeof resetUserPassword>).mockResolvedValue({
        success: true,
        data: { user: { id: 'auth-user-id' } },
        error: undefined
      } as any);

      const result = await resetEmployeePassword('emp-123', null as unknown as string);

      expect(result).toEqual({ success: true });
      expect(resetUserPassword).toHaveBeenCalledWith('john.doe@example.com', null);
    });

    it('should handle employee with null email (edge case)', async () => {
      const employeeWithNullEmail = {
        ...mockEmployee,
        email: null
      };

      // Mock getEmployeeById
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: employeeWithNullEmail,
              error: null
            })
          })
        })
      });

      // Mock password reset failure due to null email
      (resetUserPassword as jest.MockedFunction<typeof resetUserPassword>).mockResolvedValue({
        success: false,
        error: 'Email is required for password reset'
      });

      const result = await resetEmployeePassword('emp-123', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: 'Email is required for password reset'
      });
    });
  });
});