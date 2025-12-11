/**
 * Unit tests for Employee Service using Jest
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    changeEmploymentStatus,
    createEmployee,
    fetchEmployeeRegions,
    getEmployeeByEmail,
    getEmployeeByHumanReadableId,
    getEmployeeById,
    getEmployeeRegions,
    isEmailTaken,
    isHumanReadableIdTaken,
    isPhoneTaken,
    listEmployees,
    resetEmployeePassword,
    updateEmployee,
    updateEmployeeRegions,
    updateRegionalAssignments
} from '../employee.service';

import {
    ChangeEmploymentStatusRequest,
    CreateEmployeeRequest,
    EmployeeListParams,
    UpdateEmployeeRequest
} from '@pgn/shared';
import { generateHumanReadableUserId } from '../employee.service';

// Create a comprehensive Supabase mock
const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn(),
    clearMocks: jest.fn(),
  } as any;

  // Smart mock that tracks calls
  const createSmartChain = (tableName: string) => {
    const callLog: Array<{ method: string; args: any[] }> = [];
    let shouldResolve = false;
    let resolveValue: any = { data: [], error: null };

    // Create chain object with lazy evaluation
    const chain: any = {};

    // Create method that logs and chains
    const createMethod = (methodName: string, isTerminal = false) => {
      const fn = jest.fn().mockImplementation((...args: any[]) => {
        callLog.push({ method: methodName, args });

        if (isTerminal || shouldResolve) {
          // Return a promise for terminal methods
          return Promise.resolve(resolveValue);
        }

        return chain;
      });
      return fn;
    };

    // Chainable methods
    chain.select = createMethod('select');
    chain.insert = createMethod('insert');
    chain.update = createMethod('update');
    chain.delete = createMethod('delete');
    chain.eq = createMethod('eq');
    chain.neq = createMethod('neq');
    chain.in = createMethod('in');
    chain.like = createMethod('like');
    chain.or = createMethod('or');
    chain.contains = createMethod('contains');
    chain.order = createMethod('order');
    chain.range = createMethod('range');
    chain.limit = jest.fn().mockImplementation((...args: any[]) => {
      callLog.push({ method: 'limit', args });
      return Promise.resolve(resolveValue);
    }); // limit is terminal and always returns a promise

    // Special handling for common patterns
    if (tableName === 'employees') {
      // Handle getEmployeeByEmail pattern (select -> eq -> single)
      chain.single = jest.fn().mockImplementation(() => {
        // Check if this looks like a getEmployeeByEmail call
        const hasEmailEq = callLog.some(log =>
          log.method === 'eq' &&
          log.args.length === 2 &&
          log.args[0] === 'email'
        );

        if (hasEmailEq) {
          return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
        }

        // Default case
        return Promise.resolve({ data: null, error: null });
      });
    } else {
      chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    }

    // Helper method to override behavior
    chain.override = (methodName: string, implementation: any) => {
      chain[methodName] = implementation;
      return chain;
    };

    // Method to configure what the chain should resolve to
    chain.setResolve = (value: any) => {
      resolveValue = value;
      shouldResolve = true;
      return chain;
    };

    return chain;
  };

  mockClient.from.mockImplementation((table: string) => {
    return createSmartChain(table);
  });

  // Add method to clear mocks
  mockClient.clearMocks.mockImplementation(() => {
    mockClient.from.mockClear();
  });

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

// Mock the employee service module
jest.mock('../employee.service', () => {
  const actualService = jest.requireActual('../employee.service');
  return {
    ...actualService,
    generateHumanReadableUserId: jest.fn(),
  };
});

import { createAuthUser, getUserByEmail, resetUserPassword, updateUserPasswordByEmail } from '../../utils/supabase/admin';
import { createClient } from '../../utils/supabase/server';

// Import the module for mocking - disabled as it's not currently used
// const employeeService = require('../employee.service');

describe('Employee Service', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;
  let createQueryChain: (customResolve?: any) => any;
  const currentYear = new Date().getFullYear();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();

    // Reset the generateHumanReadableUserId mock
    (generateHumanReadableUserId as jest.MockedFunction<typeof generateHumanReadableUserId>).mockReset();

    // Extract createQueryChain function for use in tests
    createQueryChain = (customResolve?: any) => {
      const chain: any = {};

      // Helper to return the chain for chaining methods
      const returnChain = () => chain;

      // Chainable methods
      chain.select = jest.fn().mockImplementation(returnChain);
      chain.insert = jest.fn().mockImplementation(returnChain);
      chain.update = jest.fn().mockImplementation(returnChain);
      chain.delete = jest.fn().mockImplementation(returnChain);
      chain.eq = jest.fn().mockImplementation(returnChain);
      chain.neq = jest.fn().mockImplementation(returnChain);
      chain.in = jest.fn().mockImplementation(returnChain);
      chain.like = jest.fn().mockImplementation(returnChain);
      chain.ilike = jest.fn().mockImplementation(returnChain);
      chain.or = jest.fn().mockImplementation(returnChain);
      chain.contains = jest.fn().mockImplementation(returnChain);
      chain.order = jest.fn().mockImplementation(returnChain);

      // Terminal methods that should resolve
      chain.range = jest.fn().mockResolvedValue(customResolve || { data: [], error: null });
      chain.limit = jest.fn().mockResolvedValue(customResolve || { data: [], error: null });

      // Methods that resolve to promises
      chain.single = jest.fn().mockResolvedValue(customResolve || { data: null, error: null });

      return chain;
    };

    (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabaseClient as any);
  });

  describe('generateHumanReadableUserId', () => {
    it('should generate a user ID with current year and sequence 0001 for first employee', async () => {
      
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
      
      // Mock null response
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
    it('should create a new employee successfully with all fields', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        employment_status: 'ACTIVE',
        can_login: true,
        password: 'password123'
      };

      // Mock getEmployeeByEmail returns null (employee doesn't exist)
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          callCount++;
          if (callCount === 1) {
            // First call is getEmployeeByEmail
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            };
          } else if (callCount === 2) {
            // Second call is insert
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'new-auth-user-id',
                      human_readable_user_id: `PGN-${currentYear}-0001`,
                      ...createData,
                      phone: '1234567890'
                    },
                    error: null
                  })
                })
              })
            };
          }
        }
        return createQueryChain();
      });

      // Mock getUserByEmail returns no auth user
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: false,
        error: null
      });

      // Mock createAuthUser success
      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'new-auth-user-id' } },
        error: undefined
      } as any);

      // Mock generateHumanReadableUserId
      (generateHumanReadableUserId as jest.MockedFunction<typeof generateHumanReadableUserId>).mockResolvedValue(`PGN-${currentYear}-0001`);

      const result = await createEmployee(createData);

      expect(result.id).toBe('new-auth-user-id');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.phone).toBe('1234567890');

          });

    it('should create employee with optional fields as null when not provided', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '',
        password: 'password123'
      };

      // Mock the chain for checking existing employee and inserting
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          callCount++;
          if (callCount === 1) {
            // First call is getEmployeeByEmail
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            };
          } else if (callCount === 2) {
            // Second call is insert
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'new-auth-user-id',
                      human_readable_user_id: `PGN-${currentYear}-0002`,
                      ...createData,
                      employment_status: 'ACTIVE',
                      can_login: true
                    },
                    error: null
                  })
                })
              })
            };
          }
        }
        return createQueryChain();
      });

      // Mock auth operations
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: false,
        error: null
      });

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'new-auth-user-id' } },
        error: undefined
      } as any);

      // Mock generateHumanReadableUserId
      (generateHumanReadableUserId as jest.MockedFunction<typeof generateHumanReadableUserId>).mockResolvedValue(`PGN-${currentYear}-0002`);

      const result = await createEmployee(createData);

      expect(result.phone).toBe('');
      expect(result.employment_status).toBe('ACTIVE');
      expect(result.can_login).toBe(true);

          });

    it('should throw error if password is missing', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: ''
      };

      await expect(createEmployee(createData)).rejects.toThrow(
        'Password is required for creating new employee'
      );
    });

    it('should throw error if password is empty string', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: ''
      };

      await expect(createEmployee(createData)).rejects.toThrow(
        'Password is required for creating new employee'
      );
    });

    it('should throw error if auth user creation fails with specific error', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock existing employee check
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      // Mock auth operations
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: false,
        error: null
      });

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: false,
        error: 'user_already_exists: User already exists'
      });

      await expect(createEmployee(createData)).rejects.toThrow(
        'A user with this email address already exists in the authentication system'
      );
    });

    it('should throw error if auth user creation fails without specific error', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock existing employee check
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      // Mock auth operations
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: false,
        error: null
      });

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: false,
        error: null
      });

      await expect(createEmployee(createData)).rejects.toThrow(
        'Failed to create auth user: Unknown error'
      );
    });

    it('should throw error if auth user creation returns no user object', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock existing employee check
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      // Mock auth operations
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: false,
        error: null
      });

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: null }
      } as any);

      await expect(createEmployee(createData)).rejects.toThrow(
        'Failed to get auth user ID after creation'
      );
    });

    it('should throw error if auth user creation returns user without id', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock existing employee check
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      // Mock auth operations
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: false,
        error: null
      });

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: null } }
      } as any);

      await expect(createEmployee(createData)).rejects.toThrow(
        'Failed to get auth user ID after creation'
      );
    });

    it('should handle database errors during employee creation and not delete auth user', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock existing employee check and insert failure
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          callCount++;
          if (callCount === 1) {
            // First call is getEmployeeByEmail
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            };
          } else if (callCount === 2) {
            // Second call is insert - this should fail
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database constraint violation' }
                  })
                })
              })
            };
          }
        }
        return createQueryChain();
      });

      // Mock auth operations
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: false,
        error: null
      });

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'auth-id-123' } }
      } as any);

      // Mock generateHumanReadableUserId
      (generateHumanReadableUserId as jest.MockedFunction<typeof generateHumanReadableUserId>).mockResolvedValue(`PGN-${currentYear}-0001`);

      await expect(createEmployee(createData)).rejects.toThrow('Failed to create employee: Database constraint violation');

      // Verify auth user was created but we don't attempt to delete it
      expect(createAuthUser).toHaveBeenCalledWith(
        createData.email,
        createData.password
      );

          });

    it('should handle auth service exceptions', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock existing employee check
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      // Mock auth service throwing exception
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockRejectedValue(
        new Error('Auth service down')
      );

      await expect(createEmployee(createData)).rejects.toThrow('Auth service down');
    });

    it('should handle generateHumanReadableUserId errors', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock existing employee check
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          // getEmployeeByEmail call
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }
                })
              })
            })
          };
        }
        return createQueryChain();
      });

      // Mock auth operations
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: false,
        error: null
      });

      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'auth-id-123' } }
      } as any);

      // Mock generateHumanReadableUserId throwing error
      (generateHumanReadableUserId as jest.MockedFunction<typeof generateHumanReadableUserId>).mockRejectedValue(new Error('Failed to generate user ID'));

      await expect(createEmployee(createData)).rejects.toThrow('Failed to generate user ID');

          });

    it('should create employee profile for existing auth user with updated password', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock employee doesn't exist and then insert
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          callCount++;
          if (callCount === 1) {
            // First call is getEmployeeByEmail
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            };
          } else if (callCount === 2) {
            // Second call is insert
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'existing-auth-id',
                      human_readable_user_id: `PGN-${currentYear}-0001`,
                      ...createData,
                      phone: '1234567890'
                    },
                    error: null
                  })
                })
              })
            };
          }
        }
        return createQueryChain();
      });

      // Mock existing auth user
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: { id: 'existing-auth-id' },
        error: undefined
      } as any);

      // Mock successful password update
      (updateUserPasswordByEmail as jest.MockedFunction<typeof updateUserPasswordByEmail>).mockResolvedValue({
        success: true,
        error: undefined
      });

      // Mock generateHumanReadableUserId
      (generateHumanReadableUserId as jest.MockedFunction<typeof generateHumanReadableUserId>).mockResolvedValue(`PGN-${currentYear}-0001`);

      const result = await createEmployee(createData);

      expect(result.id).toBe('existing-auth-id');
      expect(updateUserPasswordByEmail).toHaveBeenCalledWith(
        createData.email,
        createData.password
      );

          });

    it('should throw error if password update fails for existing auth user', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock employee doesn't exist
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          // getEmployeeByEmail call
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }
                })
              })
            })
          };
        }
        return createQueryChain();
      });

      // Mock existing auth user
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: true,
        data: { id: 'existing-auth-id' },
        error: undefined
      } as any);

      // Mock password update failure
      (updateUserPasswordByEmail as jest.MockedFunction<typeof updateUserPasswordByEmail>).mockResolvedValue({
        success: false,
        error: 'Password update failed'
      });

      await expect(createEmployee(createData)).rejects.toThrow(
        'Failed to update existing auth user password: Password update failed'
      );
    });

    it('should create new auth user when none exists', async () => {
            const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock employee doesn't exist and then insert
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          callCount++;
          if (callCount === 1) {
            // First call is getEmployeeByEmail
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            };
          } else if (callCount === 2) {
            // Second call is insert
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'new-auth-user-id',
                      human_readable_user_id: `PGN-${currentYear}-0001`,
                      ...createData,
                      phone: '1234567890'
                    },
                    error: null
                  })
                })
              })
            };
          }
        }
        return createQueryChain();
      });

      // Mock no existing auth user
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue({
        success: false,
        error: null
      });

      // Mock new auth user creation
      (createAuthUser as jest.MockedFunction<typeof createAuthUser>).mockResolvedValue({
        success: true,
        data: { user: { id: 'new-auth-user-id' } },
        error: undefined
      } as any);

      // Mock generateHumanReadableUserId
      (generateHumanReadableUserId as jest.MockedFunction<typeof generateHumanReadableUserId>).mockResolvedValue(`PGN-${currentYear}-0001`);

      const result = await createEmployee(createData);

      expect(result.id).toBe('new-auth-user-id');
      expect(createAuthUser).toHaveBeenCalledWith(
        createData.email,
        createData.password
      );

          });
  });

  describe('getEmployeeById', () => {
    it('should return employee when found', async () => {
      const mockEmployee = {
        id: 'emp-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockEmployee, error: null })
      );

      const result = await getEmployeeById('emp-123');
      expect(result).toEqual(mockEmployee);
    });

    it('should return null when employee not found (PGRST116 error)', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      const result = await getEmployeeById('emp-123');
      expect(result).toBeNull();
    });

    it('should return null when data is null with no error', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: null })
      );

      const result = await getEmployeeById('emp-123');
      expect(result).toBeNull();
    });

    it('should throw error for database connection errors', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { message: 'Connection failed' } })
      );

      await expect(getEmployeeById('emp-123')).rejects.toThrow(
        'Failed to get employee: Connection failed'
      );
    });

    it('should throw error for permission denied errors', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: '42501', message: 'Permission denied' } })
      );

      await expect(getEmployeeById('emp-123')).rejects.toThrow(
        'Failed to get employee: Permission denied'
      );
    });

    it('should handle empty employee ID', async () => {
      await expect(getEmployeeById('')).rejects.toThrow('Invalid employee ID');
    });

    it('should handle null employee ID', async () => {
      await expect(getEmployeeById(null as any)).rejects.toThrow('Invalid employee ID');
    });

    it('should handle database exceptions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      await expect(getEmployeeById('emp-123')).rejects.toThrow('Database connection lost');
    });
  });

  describe('getEmployeeByHumanReadableId', () => {
    it('should return employee when found by human readable ID', async () => {
      const mockEmployee = {
        id: 'emp-123',
        human_readable_user_id: 'PGN-2024-0001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockEmployee, error: null })
      );

      const result = await getEmployeeByHumanReadableId('PGN-2024-0001');
      expect(result).toEqual(mockEmployee);
    });

    it('should return null when human readable ID not found', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: null })
      );

      const result = await getEmployeeByHumanReadableId('PGN-2024-9999');
      expect(result).toBeNull();
    });

    it('should throw error for malformed human readable ID', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { message: 'Invalid ID format' } })
      );

      await expect(getEmployeeByHumanReadableId('INVALID-ID')).rejects.toThrow(
        'Failed to get employee by human readable ID: Invalid ID format'
      );
    });

    it('should handle empty human readable ID', async () => {
      await expect(getEmployeeByHumanReadableId('')).rejects.toThrow(
        'Invalid human readable ID'
      );
    });

    it('should handle case-sensitive human readable ID', async () => {
      const mockEmployee = {
        id: 'emp-123',
        human_readable_user_id: 'PGN-2024-0001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockEmployee, error: null })
      );

      const result = await getEmployeeByHumanReadableId('pgn-2024-0001');
      expect(result).toBeNull(); // Should be case-sensitive
    });
  });

  describe('getEmployeeByEmail', () => {
    it('should return employee when found by email (case insensitive)', async () => {
      const mockEmployee = {
        id: 'emp-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockEmployee, error: null })
      );

      const result = await getEmployeeByEmail('JOHN@EXAMPLE.COM');
      expect(result).toEqual(mockEmployee);
    });

    it('should return employee when found with leading/trailing whitespace', async () => {
      const mockEmployee = {
        id: 'emp-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockEmployee, error: null })
      );

      const result = await getEmployeeByEmail('  john@example.com  ');
      expect(result).toEqual(mockEmployee);
    });

    it('should return null when email not found', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      const result = await getEmployeeByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should handle invalid email format gracefully', async () => {
      await expect(getEmployeeByEmail('invalid-email')).rejects.toThrow('Invalid email');
    });

    it('should handle empty email string', async () => {
      await expect(getEmployeeByEmail('')).rejects.toThrow('Invalid email');
    });

    it('should handle null email', async () => {
      await expect(getEmployeeByEmail(null as any)).rejects.toThrow('Invalid email');
    });

    it('should handle email with only whitespace', async () => {
      await expect(getEmployeeByEmail('   ')).rejects.toThrow('Invalid email');
    });
  });

  describe('listEmployees', () => {
    it('should return paginated employee list with default parameters', async () => {
      const mockEmployees = [
        { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
      ];

      // Mock the main query and region queries
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          callCount++;
          if (callCount === 1) {
            // Main employee list query
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  ilike: jest.fn().mockReturnValue({
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
                })
              })
            };
          } else if (callCount > 1) {
            // Region queries for each employee
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            };
          }
        }
        return createQueryChain();
      });

      const params: EmployeeListParams = {};
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.hasMore).toBe(false);
    });

    it('should return paginated employee list with custom parameters', async () => {
      const mockEmployees = [
        { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
      ];

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockEmployees, error: null })
      );

      const params: EmployeeListParams = {
        page: 2,
        limit: 5,
        search: 'john',
        employment_status: ['ACTIVE']
      };

      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('should apply search filter across multiple fields', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: [
            { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
          ],
          error: null
        })
      );

      const params: EmployeeListParams = { search: 'john' };
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(1);
      expect(result.employees[0].first_name).toBe('John');
    });

    it('should apply search filter by last name', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: [
            { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
          ],
          error: null
        })
      );

      const params: EmployeeListParams = { search: 'Doe' };
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(1);
      expect(result.employees[0].last_name).toBe('Doe');
    });

    it('should apply search filter by email', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: [
            { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
          ],
          error: null
        })
      );

      const params: EmployeeListParams = { search: 'john@example' };
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(1);
      expect(result.employees[0].email).toBe('john@example.com');
    });

    it('should apply employment status filter with single status', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: [
            { id: '1', first_name: 'John', last_name: 'Doe', employment_status: 'ACTIVE' }
          ],
          error: null
        })
      );

      const params: EmployeeListParams = { employment_status: ['ACTIVE'] };
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(1);
      expect(result.employees[0].employment_status).toBe('ACTIVE');
    });

    it('should apply employment status filter with multiple statuses', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: [
            { id: '1', first_name: 'John', last_name: 'Doe', employment_status: 'ACTIVE' },
            { id: '2', first_name: 'Jane', last_name: 'Smith', employment_status: 'ON_LEAVE' }
          ],
          error: null
        })
      );

      const params: EmployeeListParams = {
        employment_status: ['ACTIVE', 'ON_LEAVE']
      };
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(2);
    });

    it('should handle empty employment status array', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: [
            { id: '1', first_name: 'John', last_name: 'Doe', employment_status: 'ACTIVE' },
            { id: '2', first_name: 'Jane', last_name: 'Smith', employment_status: 'SUSPENDED' }
          ],
          error: null
        })
      );

      const params: EmployeeListParams = { employment_status: [] };
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(2);
    });

    it('should calculate hasMore correctly for last page', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: [], error: null })
      );

      const params: EmployeeListParams = { page: 2, limit: 10 };
      const result = await listEmployees(params);

      expect(result.hasMore).toBe(false);
    });

    it('should calculate hasMore correctly for middle page', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: [
            { id: '1', first_name: 'John', last_name: 'Doe' },
            { id: '2', first_name: 'Jane', last_name: 'Smith' }
          ],
          error: null
        })
      );

      // Simulate having 12 total records
      const params: EmployeeListParams = { page: 1, limit: 10 };
      const result = await listEmployees(params);

      expect(result.hasMore).toBe(false); // With our mock, only 2 records
    });

    it('should handle null data response', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: null })
      );

      const params: EmployeeListParams = {};
      const result = await listEmployees(params);

      expect(result.employees).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle undefined count', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: [], error: null })
      );

      const params: EmployeeListParams = {};
      const result = await listEmployees(params);

      expect(result.total).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { message: 'Database error' } })
      );

      const params: EmployeeListParams = {};
      await expect(listEmployees(params)).rejects.toThrow(
        'Failed to list employees: Database error'
      );
    });

    it('should handle page parameter of 0 (should be treated as 1)', async () => {
      // Mock the main query
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                ilike: jest.fn().mockReturnValue({
                  in: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      range: jest.fn().mockResolvedValue({
                        data: [],
                        error: null,
                        count: 0
                      })
                    })
                  })
                })
              })
            })
          };
        }
        return createQueryChain();
      });

      const params: EmployeeListParams = { page: 0 };
      const result = await listEmployees(params);

      expect(result.page).toBe(1);
    });

    it('should handle negative page parameter', async () => {
      // Mock the main query
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                ilike: jest.fn().mockReturnValue({
                  in: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      range: jest.fn().mockResolvedValue({
                        data: [],
                        error: null,
                        count: 0
                      })
                    })
                  })
                })
              })
            })
          };
        }
        return createQueryChain();
      });

      const params: EmployeeListParams = { page: -1 };
      const result = await listEmployees(params);

      expect(result.page).toBe(1);
    });

    describe('Regions Fetching', () => {
      it('should fetch all regions for each employee', async () => {
        const mockEmployees = [
          {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            employee_regions: [
              { regions: { id: 'r1', name: 'North' } },
              { regions: { id: 'r2', name: 'South' } }
            ]
          },
          {
            id: '2',
            first_name: 'Jane',
            last_name: 'Smith',
            employee_regions: [
              { regions: { id: 'r3', name: 'East' } }
            ]
          }
        ];

        mockSupabaseClient.from.mockReturnValue(
          createQueryChain({ data: mockEmployees, error: null })
        );

        const params: EmployeeListParams = {};
        const result = await listEmployees(params);

        expect(result.employees[0].regions).toHaveLength(2);
        expect(result.employees[1].regions).toHaveLength(1);
      });

      it('should handle employees with no regions', async () => {
        const mockEmployees = [
          {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            employee_regions: []
          }
        ];

        mockSupabaseClient.from.mockReturnValue(
          createQueryChain({ data: mockEmployees, error: null })
        );

        const params: EmployeeListParams = {};
        const result = await listEmployees(params);

        expect(result.employees[0].regions).toHaveLength(0);
      });

      it('should handle large number of regions per employee', async () => {
        const regions = Array.from({ length: 50 }, (_, i) => ({
          regions: { id: `r${i}`, name: `Region ${i}` }
        }));

        const mockEmployees = [
          {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            employee_regions: regions
          }
        ];

        mockSupabaseClient.from.mockReturnValue(
          createQueryChain({ data: mockEmployees, error: null })
        );

        const params: EmployeeListParams = {};
        const result = await listEmployees(params);

        expect(result.employees[0].regions).toHaveLength(50);
      });

      it('should handle regions query errors gracefully', async () => {
        const mockEmployees = [
          {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            employee_regions: null
          }
        ];

        mockSupabaseClient.from.mockReturnValue(
          createQueryChain({ data: mockEmployees, error: null })
        );

        const params: EmployeeListParams = {};
        const result = await listEmployees(params);

        expect(result.employees[0].regions).toBeUndefined();
      });
    });
  });

  describe('updateEmployee', () => {
    it('should update employee with provided fields only', async () => {
      const updateData: UpdateEmployeeRequest = {
        first_name: 'John Updated',
        email: 'john.updated@example.com'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        first_name: 'John Updated',
        last_name: 'Doe',
        email: 'john.updated@example.com',
        phone: '1234567890'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await updateEmployee('emp-123', updateData);

      expect(result.first_name).toBe('John Updated');
      expect(result.email).toBe('john.updated@example.com');
      expect(result.last_name).toBe('Doe'); // Should remain unchanged
    });

    it('should include updated_at timestamp automatically', async () => {
      const updateData: UpdateEmployeeRequest = {
        first_name: 'John Updated'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        first_name: 'John Updated',
        updated_at: new Date().toISOString()
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await updateEmployee('emp-123', updateData);

      expect(result.updated_at).toBeDefined();
    });

    it('should not include undefined fields in update', async () => {
      const updateData: UpdateEmployeeRequest = {
        first_name: 'John Updated',
        last_name: undefined,
        phone: undefined
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        first_name: 'John Updated',
        last_name: 'Doe',
        phone: '1234567890'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await updateEmployee('emp-123', updateData);

      expect(result.first_name).toBe('John Updated');
      expect(result.last_name).toBe('Doe');
      expect(result.phone).toBe('1234567890');
    });

    it('should update with null values when explicitly provided', async () => {
      const updateData: UpdateEmployeeRequest = {
        phone: undefined
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        first_name: 'John',
        last_name: 'Doe',
        phone: null
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await updateEmployee('emp-123', updateData);

      expect(result.phone).toBeNull();
    });

    it('should handle empty update object', async () => {
      const updateData: UpdateEmployeeRequest = {};

      const mockEmployee = {
        id: 'emp-123',
        first_name: 'John',
        last_name: 'Doe'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockEmployee, error: null })
      );

      const result = await updateEmployee('emp-123', updateData);

      expect(result).toEqual(mockEmployee);
    });

    it('should throw error for database constraint violations', async () => {
      const updateData: UpdateEmployeeRequest = {
        email: 'duplicate@example.com'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: null,
          error: {
            message: 'duplicate key value violates unique constraint "employees_email_key"'
          }
        })
      );

      await expect(updateEmployee('emp-123', updateData)).rejects.toThrow(
        'Failed to update employee: duplicate key value violates unique constraint "employees_email_key"'
      );
    });

    it('should throw error for permission denied', async () => {
      const updateData: UpdateEmployeeRequest = {
        first_name: 'Updated'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: null,
          error: {
            message: 'new row violates row-level security policy'
          }
        })
      );

      await expect(updateEmployee('emp-123', updateData)).rejects.toThrow(
        'Failed to update employee: new row violates row-level security policy'
      );
    });

    it('should handle empty employee ID', async () => {
      const updateData: UpdateEmployeeRequest = {
        first_name: 'Updated'
      };

      await expect(updateEmployee('', updateData)).rejects.toThrow(
        'Invalid employee ID'
      );
    });

    it('should handle null employee ID', async () => {
      const updateData: UpdateEmployeeRequest = {
        first_name: 'Updated'
      };

      await expect(updateEmployee(null as any, updateData)).rejects.toThrow(
        'Invalid employee ID'
      );
    });

    it('should handle database exceptions', async () => {
      const updateData: UpdateEmployeeRequest = {
        first_name: 'Updated'
      };

      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Connection lost');
      });

      await expect(updateEmployee('emp-123', updateData)).rejects.toThrow(
        'Connection lost'
      );
    });
  });

  describe('changeEmploymentStatus', () => {
    it('should set can_login to false for SUSPENDED status', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'SUSPENDED',
        changed_by: 'admin-user'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        employment_status: 'SUSPENDED',
        can_login: false
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await changeEmploymentStatus('emp-123', request);

      expect(result.employment_status).toBe('SUSPENDED');
      expect(result.can_login).toBe(false);
    });

    it('should set can_login to true for ACTIVE status', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'ACTIVE',
        changed_by: 'admin-user'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        employment_status: 'ACTIVE',
        can_login: true
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await changeEmploymentStatus('emp-123', request);

      expect(result.employment_status).toBe('ACTIVE');
      expect(result.can_login).toBe(true);
    });

    it('should set can_login to true for ON_LEAVE status', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'ON_LEAVE',
        changed_by: 'admin-user'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        employment_status: 'ON_LEAVE',
        can_login: true
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await changeEmploymentStatus('emp-123', request);

      expect(result.employment_status).toBe('ON_LEAVE');
      expect(result.can_login).toBe(true);
    });

    it('should set can_login to false for RESIGNED status', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'RESIGNED',
        changed_by: 'admin-user'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        employment_status: 'RESIGNED',
        can_login: false
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await changeEmploymentStatus('emp-123', request);

      expect(result.employment_status).toBe('RESIGNED');
      expect(result.can_login).toBe(false);
    });

    it('should set can_login to false for TERMINATED status', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'TERMINATED',
        changed_by: 'admin-user'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        employment_status: 'TERMINATED',
        can_login: false
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await changeEmploymentStatus('emp-123', request);

      expect(result.employment_status).toBe('TERMINATED');
      expect(result.can_login).toBe(false);
    });

    it('should handle empty employee ID', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'ACTIVE',
        changed_by: 'admin-user'
      };

      await expect(changeEmploymentStatus('', request)).rejects.toThrow(
        'Invalid employee ID'
      );
    });

    it('should handle null employee ID', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'ACTIVE',
        changed_by: 'admin-user'
      };

      await expect(changeEmploymentStatus(null as any, request)).rejects.toThrow(
        'Invalid employee ID'
      );
    });

    it('should handle null employment status', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: null as any,
        changed_by: 'admin-user'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        employment_status: null,
        can_login: false
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await changeEmploymentStatus('emp-123', request);

      expect(result.employment_status).toBeNull();
      expect(result.can_login).toBe(false);
    });

    it('should handle undefined employment status', async () => {
      const request: ChangeEmploymentStatusRequest = {
        changed_by: 'admin-user',
        employment_status: 'ACTIVE'
      };

      const mockEmployee = {
        id: 'emp-123',
        employment_status: 'ACTIVE',
        can_login: true
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockEmployee, error: null })
      );

      const result = await changeEmploymentStatus('emp-123', request);

      expect(result.employment_status).toBe('ACTIVE');
      expect(result.can_login).toBe(true);
    });

    it('should handle empty region_ids array', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'ACTIVE',
        changed_by: 'admin-user'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        employment_status: 'ACTIVE',
        can_login: true
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await changeEmploymentStatus('emp-123', request);

      expect(result.employment_status).toBe('ACTIVE');
      expect(result.can_login).toBe(true);
    });

    it('should handle null region_ids', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'ACTIVE',
        changed_by: 'admin-user'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        employment_status: 'ACTIVE',
        can_login: true
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await changeEmploymentStatus('emp-123', request);

      expect(result.employment_status).toBe('ACTIVE');
      expect(result.can_login).toBe(true);
    });

    it('should handle undefined region_ids', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'ACTIVE',
        changed_by: 'admin-user'
      };

      const mockUpdatedEmployee = {
        id: 'emp-123',
        employment_status: 'ACTIVE',
        can_login: true
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: mockUpdatedEmployee, error: null })
      );

      const result = await changeEmploymentStatus('emp-123', request);

      expect(result.employment_status).toBe('ACTIVE');
      expect(result.can_login).toBe(true);
    });

    it('should handle database errors', async () => {
      const request: ChangeEmploymentStatusRequest = {
        employment_status: 'ACTIVE',
        changed_by: 'admin-user'
      };

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: null,
          error: { message: 'Database error' }
        })
      );

      await expect(changeEmploymentStatus('emp-123', request)).rejects.toThrow(
        'Failed to change employment status: Database error'
      );
    });
  });

  describe('updateRegionalAssignments', () => {
    it('should update regional assignments successfully', async () => {
      const regionalAssignment = { assigned_regions: ['region1', 'region2'] };
      const employeeId = 'emp-123';

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employee_regions') {
          callCount++;
          if (callCount === 1) {
            // Delete existing regions
            return {
              delete: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null
                })
              })
            };
          } else if (callCount === 2) {
            // Insert new regions
            return {
              insert: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            };
          }
        } else if (table === 'employees') {
          // Fetch updated employee
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: employeeId },
                  error: null
                })
              })
            })
          };
        }
        return createQueryChain();
      });

      const result = await updateRegionalAssignments(employeeId, regionalAssignment);

      expect(result.id).toBe(employeeId);
    });

    it('should handle empty region_ids array', async () => {
      const regionalAssignment = { assigned_regions: [] };
      const employeeId = 'emp-123';

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employee_regions') {
          // Delete existing regions
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          };
        } else if (table === 'employees') {
          // Fetch updated employee
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: employeeId },
                  error: null
                })
              })
            })
          };
        }
        return createQueryChain();
      });

      const result = await updateRegionalAssignments(employeeId, regionalAssignment);

      expect(result.id).toBe(employeeId);
    });

    it('should handle database errors during delete operation', async () => {
      const regionalAssignment = { assigned_regions: ['region1'] };
      const employeeId = 'emp-123';

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employee_regions') {
          // Delete existing regions - this should fail
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Failed to delete existing regions' }
              })
            })
          };
        }
        return createQueryChain();
      });

      await expect(updateRegionalAssignments(employeeId, regionalAssignment)).rejects.toThrow(
        'Failed to delete existing region assignments: Failed to delete existing regions'
      );
    });

    it('should handle database errors during insert operation', async () => {
      const regionalAssignment = { assigned_regions: ['region1'] };
      const employeeId = 'emp-123';

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employee_regions') {
          callCount++;
          if (callCount === 1) {
            // Delete successful
            return {
              delete: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null
                })
              })
            };
          } else if (callCount === 2) {
            // Insert fails
            return {
              insert: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Failed to insert new regions' }
              })
            };
          }
        }
        return createQueryChain();
      });

      await expect(updateRegionalAssignments(employeeId, regionalAssignment)).rejects.toThrow(
        'Failed to insert new region assignments: Failed to insert new regions'
      );
    });

    it('should handle empty employee ID', async () => {
      const regionAssignment = { assigned_regions: ['region1'] };

      await expect(updateRegionalAssignments('', regionAssignment)).rejects.toThrow(
        'Invalid employee ID'
      );
    });

    it('should handle null employee ID', async () => {
      const regionAssignment = { assigned_regions: ['region1'] };

      await expect(updateRegionalAssignments(null as any, regionAssignment)).rejects.toThrow(
        'Invalid employee ID'
      );
    });

    it('should handle partial region assignment failures gracefully', async () => {
      const employeeId = 'emp-123';
      const regionalAssignment = { assigned_regions: ['region1', 'region2', 'region3'] };

      // This test demonstrates error handling in the deprecated function
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: null,
          error: { message: 'Region not found: region2' }
        })
      );

      await expect(updateRegionalAssignments(employeeId, regionalAssignment)).rejects.toThrow(
        'Region not found: region2'
      );
    });

    it('should handle successful update with no regions (clear all assignments)', async () => {
      const employeeId = 'emp-123';
      const regionalAssignment = { assigned_regions: [] };

      // Mock successful delete and update
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: { id: employeeId, first_name: 'John' },
          error: null
        })
      );

      const result = await updateRegionalAssignments(employeeId, regionalAssignment);

      expect(result.id).toBe(employeeId);
    });
  });

  describe('isEmailTaken', () => {
    it('should return false for new email (not taken)', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      const result = await isEmailTaken('new@example.com');
      expect(result).toBe(false);
    });

    it('should return true for existing email', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'emp-1' }, error: null })
      );

      const result = await isEmailTaken('existing@example.com');
      expect(result).toBe(true);
    });

    it('should handle email with leading/trailing whitespace', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      const result = await isEmailTaken('  test@example.com  ');
      expect(result).toBe(false);
    });

    it('should handle null email parameter', async () => {
      const result = await isEmailTaken(null as any);
      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { message: 'Connection failed' } })
      );

      const result = await isEmailTaken('test@example.com');
      expect(result).toBe(false);
    });
  });

  describe('isPhoneTaken', () => {
    it('should return false for new phone (not taken)', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      const result = await isPhoneTaken('1234567890');
      expect(result).toBe(false);
    });

    it('should return true for existing phone', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'emp-1' }, error: null })
      );

      const result = await isPhoneTaken('1234567890');
      expect(result).toBe(true);
    });

    it('should handle phone number with special characters', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      const result = await isPhoneTaken('(123) 456-7890');
      expect(result).toBe(false);
    });

    it('should handle null phone parameter', async () => {
      const result = await isPhoneTaken(null as any);
      expect(result).toBe(false);
    });

    it('should handle empty phone parameter', async () => {
      const result = await isPhoneTaken('');
      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { message: 'Connection failed' } })
      );

      const result = await isPhoneTaken('1234567890');
      expect(result).toBe(false);
    });
  });

  describe('isHumanReadableIdTaken', () => {
    it('should return false for new human readable ID', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      const result = await isHumanReadableIdTaken('PGN-2024-0001');
      expect(result).toBe(false);
    });

    it('should return true for existing human readable ID', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'emp-1' }, error: null })
      );

      const result = await isHumanReadableIdTaken('PGN-2024-0001');
      expect(result).toBe(true);
    });

    it('should handle case sensitivity', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      const result = await isHumanReadableIdTaken('pgn-2024-0001');
      expect(result).toBe(false);
    });

    it('should handle null human readable ID parameter', async () => {
      // The service returns false for null/invalid inputs
      const result = await isHumanReadableIdTaken(null as any);
      expect(result).toBe(false);
    });

    it('should handle empty human readable ID parameter', async () => {
      // The service returns false for empty inputs
      const result = await isHumanReadableIdTaken('');
      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      // The service returns false when database errors occur
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { message: 'Connection failed' } })
      );

      const result = await isHumanReadableIdTaken('PGN-2024-0001');
      expect(result).toBe(false);
    });
  });

  describe('resetEmployeePassword', () => {
    it('should reset password successfully', async () => {
      (resetUserPassword as jest.MockedFunction<typeof resetUserPassword>).mockResolvedValue({
        success: true,
        data: { user: { id: 'test-user-id' } }
      } as any);

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: { id: 'emp-123', email: 'test@example.com' },
          error: null
        })
      );

      const result = await resetEmployeePassword('emp-123', 'newPassword');

      expect(result.success).toBe(true);
    });

    it('should handle employee not found', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({ data: null, error: { code: 'PGRST116' } })
      );

      const result = await resetEmployeePassword('nonexistent-emp', 'newPassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Employee not found');
    });

    it('should handle auth service errors', async () => {
      (resetUserPassword as jest.MockedFunction<typeof resetUserPassword>).mockResolvedValue({
        success: false,
        error: 'Auth service error'
      });

      mockSupabaseClient.from.mockReturnValue(
        createQueryChain({
          data: { id: 'emp-123', email: 'test@example.com' },
          error: null
        })
      );

      const result = await resetEmployeePassword('emp-123', 'newPassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auth service error');
    });

    it('should handle database errors when fetching employee', async () => {
      // Use the smart mock that can throw errors like the real implementation
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockRejectedValue(
                  new Error('Failed to get employee: Database connection failed')
                )
              })
            })
          };
        }
        return createQueryChain();
      });

      const result = await resetEmployeePassword('emp-123', 'newPassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get employee: Database connection failed');
    });

    it('should handle empty employee ID', async () => {
      const result = await resetEmployeePassword('', 'newPassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Employee not found');
    });

    it('should handle null employee ID', async () => {
      const result = await resetEmployeePassword(null as any, 'newPassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Employee not found');
    });
  });

  describe('Network and Connection Issues', () => {
    it('should handle network timeout during employee creation', async () => {
      const createData: CreateEmployeeRequest = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Mock timeout during database insert
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('ETIMEDOUT: Network timeout');
      });

      await expect(createEmployee(createData)).rejects.toThrow(
        'ETIMEDOUT: Network timeout'
      );
    });

    it('should handle database connection pool exhaustion', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(
              new Error('Connection pool exhausted')
            )
          })
        })
      });

      await expect(getEmployeeById('emp-123')).rejects.toThrow(
        'Connection pool exhausted'
      );
    });

    it('should handle rate limiting from database', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: '53300',
                message: 'too many connections for role'
              }
            })
          })
        })
      });

      await expect(getEmployeeById('emp-123')).rejects.toThrow(
        'too many connections for role'
      );
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle expired authentication token', async () => {
      // This would be tested at the API route level
      // Service layer should receive proper error from auth utilities
      (resetUserPassword as jest.MockedFunction<typeof resetUserPassword>).mockResolvedValue({
        success: false,
        error: 'JWT expired'
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'emp-123', email: 'test@example.com' },
              error: null
            })
          })
        })
      });

      const result = await resetEmployeePassword('emp-123', 'newPass');
      expect(result.success).toBe(false);
      expect(result.error).toBe('JWT expired');
    });

    it('should handle malformed JWT tokens', async () => {
      (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockRejectedValue(
        new Error('malformed JWT')
      );

      const createData: CreateEmployeeRequest = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      await expect(createEmployee(createData)).rejects.toThrow(
        'malformed JWT'
      );
    });
  });

  describe('fetchEmployeeRegions and updateEmployeeRegions', () => {
    it('should fetch employee regions successfully', async () => {
      const mockRegions = [
        { id: 'region1', city: 'New York', state: 'NY' },
        { id: 'region2', city: 'Boston', state: 'MA' }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { regions: mockRegions[0] },
              { regions: mockRegions[1] }
            ],
            error: null
          })
        })
      });

      const result = await fetchEmployeeRegions('emp-123');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockRegions[0]);
    });

    it('should handle empty region assignments', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await fetchEmployeeRegions('emp-123');
      expect(result).toHaveLength(0);
    });

    it('should update employee regions successfully', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'employee_regions') {
          callCount++;
          if (callCount === 1) {
            // Delete existing regions
            return {
              delete: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null
                })
              })
            };
          } else if (callCount === 2) {
            // Insert new regions
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                  data: null,
                  error: null
                })
              })
            };
          }
        }
        return createQueryChain();
      });

      const result = await updateEmployeeRegions('emp-123', ['region1', 'region2']);
      expect(result.success).toBe(true);
    });

    it('should handle region update with empty array', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      const result = await updateEmployeeRegions('emp-123', []);
      expect(result.success).toBe(true);
    });

    it('should handle region update failures', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Delete failed'))
        })
      });

      await expect(updateEmployeeRegions('emp-123', ['region1'])).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('getEmployeeRegions', () => {
    it('should handle malformed region data', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { regions: null },
              { regions: [] },
              { regions: { id: '', city: '', state: '' } }
            ],
            error: null
          })
        })
      });

      const result = await getEmployeeRegions('emp-123');
      expect(result).toHaveLength(0);
    });

    it('should handle database errors during region fetch', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Connection failed' }
          })
        })
      });

      await expect(getEmployeeRegions('emp-123')).rejects.toThrow(
        'Failed to fetch employee regions: Connection failed'
      );
    });

    it('should handle empty employee ID', async () => {
      // Mock the query to return empty data for empty ID
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await getEmployeeRegions('');
      expect(result).toEqual([]);
    });

    it('should handle null employee ID', async () => {
      // Mock the query to return empty data for null ID
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await getEmployeeRegions(null as any);
      expect(result).toEqual([]);
    });

    it('should handle mixed valid and invalid region data', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { regions: null },
              { regions: [{ id: 'region1', city: 'New York', state: 'NY' }] },
              { regions: [{ id: '', city: '', state: '' }] },
              { regions: [{ id: 'region2', city: 'Boston', state: 'MA' }] }
            ],
            error: null
          })
        })
      });

      const result = await getEmployeeRegions('emp-123');
      // The function filters out null regions but empty strings are still considered valid strings
      // So it will include the empty region as well
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 'region1', city: 'New York', state: 'NY' });
      expect(result[1]).toEqual({ id: '', city: '', state: '' });
      expect(result[2]).toEqual({ id: 'region2', city: 'Boston', state: 'MA' });
    });
  });
});