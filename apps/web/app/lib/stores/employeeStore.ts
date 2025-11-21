import { create } from 'zustand';
import { Employee, EmploymentStatus, EmployeeListParams, EmployeeListResponse, CreateEmployeeRequest, UpdateEmployeeRequest, ChangeEmploymentStatusRequest } from '@pgn/shared';
import { useUIStore } from './uiStore';
import { useAuthStore } from './authStore';

/**
 * Transform technical error messages into user-friendly ones
 */
function getUserFriendlyErrorMessage(error: string): string {
  // Clean up the error message first
  const cleanError = error.replace(/AuthApiError:\s*/, '').replace(/DatabaseError:\s*/, '').trim();

  // Handle common Supabase Auth errors
  if (cleanError.includes('An employee with this email address already exists') ||
      error.includes('An employee with this email address already exists')) {
    return 'An employee with this email address already exists. Please use the Edit Employee page to update their information instead.';
  }

  if (cleanError.includes('You do not have permission to create employees') ||
      error.includes('You do not have permission to create employees')) {
    return 'You do not have permission to create employees. Please contact your administrator.';
  }

  if (cleanError.includes('User not found')) {
    return 'Employee not found in the system.';
  }

  if (cleanError.includes('Invalid login credentials')) {
    return 'The email or password you entered is incorrect.';
  }

  if (cleanError.includes('new row violates row-level security policy')) {
    return 'You do not have permission to create employees. Please contact your administrator.';
  }

  if (cleanError.includes('duplicate key')) {
    return 'An employee with these details already exists.';
  }

  if (cleanError.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }

  if (cleanError.includes('Failed to create auth user')) {
    return 'Failed to create user account. Please check the email and try again.';
  }

  if (cleanError.includes('Network connection failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (cleanError.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Generic fallback
  return 'An error occurred. Please try again or contact support if the problem persists.';
}

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    search: string;
    status: EmploymentStatus | 'all';
    primaryRegion?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

interface EmployeeFilters {
  search?: string;
  status?: EmploymentStatus | 'all';
  primaryRegion?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    search: string;
    status: EmploymentStatus | 'all';
    primaryRegion?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };

  fetchEmployees: (params?: Partial<EmployeeListParams>) => Promise<void>;
  createEmployee: (employeeData: CreateEmployeeRequest) => Promise<{ success: boolean; error?: string; data?: Employee }>;
  updateEmployee: (id: string, employeeData: UpdateEmployeeRequest) => Promise<{ success: boolean; error?: string; data?: Employee }>;
  updateEmploymentStatus: (id: string, request: ChangeEmploymentStatusRequest) => Promise<{ success: boolean; error?: string }>;
  resetEmployeePassword: (id: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  setSelectedEmployee: (employee: Employee | null) => void;
  setFilters: (filters: Partial<EmployeeFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearFilters: () => void;
  clearError: () => void;
  setError: (error: string | null) => void;
  refetch: () => Promise<void>;
}

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;

  // For web requests, identify the client for security middleware
  // Web users are authenticated via Supabase sessions handled by middleware
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-info': 'pgn-web-client',
    'User-Agent': 'pgn-admin-dashboard/1.0.0',
  };

  // Add Authorization header only if we have a token (for mobile users)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  selectedEmployee: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  filters: {
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  },

  fetchEmployees: async (params) => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const queryParams: EmployeeListParams = {
        page: params?.page || pagination.currentPage,
        limit: params?.limit || pagination.itemsPerPage,
        search: params?.search || filters.search || undefined,
        employment_status: params?.employment_status || (filters.status !== 'all' ? [filters.status as EmploymentStatus] : undefined),
        primary_region: params?.primary_region || filters.primaryRegion,
        sort_by: params?.sort_by || filters.sortBy,
        sort_order: params?.sort_order || filters.sortOrder,
      };

      const queryString = new URLSearchParams();
      if (queryParams.page) queryString.set('page', queryParams.page.toString());
      if (queryParams.limit) queryString.set('limit', queryParams.limit.toString());
      if (queryParams.search) queryString.set('search', queryParams.search);
      if (queryParams.employment_status) queryString.set('employment_status', queryParams.employment_status.join(','));
      if (queryParams.primary_region) queryString.set('primary_region', queryParams.primary_region);
      if (queryParams.sort_by) queryString.set('sort_by', queryParams.sort_by);
      if (queryParams.sort_order) queryString.set('sort_order', queryParams.sort_order);

      const response = await fetch(`/api/employees?${queryString}`, {
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch employees');
      }

      const data: EmployeeListResponse = result.data;
      const totalPages = Math.ceil(data.total / data.limit);

      set({
        employees: data.employees,
        pagination: {
          currentPage: data.page,
          totalPages,
          totalItems: data.total,
          itemsPerPage: data.limit,
          hasNextPage: data.hasMore,
          hasPreviousPage: data.page > 1,
        },
        loading: false,
        error: null,
      });
    } catch (error) {
      const technicalMessage = error instanceof Error ? error.message : 'Failed to fetch employees';
      const userFriendlyMessage = getUserFriendlyErrorMessage(technicalMessage);
      console.error('Error fetching employees:', error);
      set({
        loading: false,
        error: technicalMessage,
        employees: [],
      });
      useUIStore.getState().showNotification(userFriendlyMessage, 'error');
    }
  },

  createEmployee: async (employeeData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(employeeData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create employee');
      }

      const newEmployee = result.data;

      // Optimistically add to the list
      set((state) => ({
        employees: [newEmployee, ...state.employees],
        loading: false,
        error: null,
      }));

      useUIStore.getState().showNotification('Employee created successfully', 'success');

      // Refresh to get updated pagination
      await get().fetchEmployees();

      return { success: true, data: newEmployee };
    } catch (error) {
      const technicalMessage = error instanceof Error ? error.message : 'Failed to create employee';
      const userFriendlyMessage = getUserFriendlyErrorMessage(technicalMessage);
      console.error('Error creating employee:', error);

      set({
        loading: false,
        error: technicalMessage,
      });

      useUIStore.getState().showNotification(userFriendlyMessage, 'error');

      return { success: false, error: userFriendlyMessage };
    }
  },

  updateEmployee: async (id, employeeData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(employeeData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update employee');
      }

      const updatedEmployee = result.data;

      // Optimistically update the employee in the list
      set((state) => ({
        employees: state.employees.map((emp) =>
          emp.id === id ? updatedEmployee : emp
        ),
        selectedEmployee: state.selectedEmployee?.id === id ? updatedEmployee : state.selectedEmployee,
        loading: false,
        error: null,
      }));

      useUIStore.getState().showNotification('Employee updated successfully', 'success');

      return { success: true, data: updatedEmployee };
    } catch (error) {
      const technicalMessage = error instanceof Error ? error.message : 'Failed to update employee';
      const userFriendlyMessage = getUserFriendlyErrorMessage(technicalMessage);
      console.error('Error updating employee:', error);

      set({
        loading: false,
        error: technicalMessage,
      });

      useUIStore.getState().showNotification(userFriendlyMessage, 'error');

      return { success: false, error: userFriendlyMessage };
    }
  },

  resetEmployeePassword: async (id, newPassword) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to reset password');
      }

      set({ loading: false, error: null });
      useUIStore.getState().showNotification('Password reset successfully', 'success');

      return { success: true };
    } catch (error) {
      const technicalMessage = error instanceof Error ? error.message : 'Failed to reset password';
      const userFriendlyMessage = getUserFriendlyErrorMessage(technicalMessage);
      console.error('Error resetting password:', error);

      set({
        loading: false,
        error: technicalMessage,
      });

      useUIStore.getState().showNotification(userFriendlyMessage, 'error');

      return { success: false, error: userFriendlyMessage };
    }
  },

  updateEmploymentStatus: async (id, request) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/employees/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update employment status');
      }

      const updatedEmployee = result.data;

      // Optimistically update the employee in the list
      set((state) => ({
        employees: state.employees.map((emp) =>
          emp.id === id ? updatedEmployee : emp
        ),
        selectedEmployee: state.selectedEmployee?.id === id ? updatedEmployee : state.selectedEmployee,
        loading: false,
        error: null,
      }));

      useUIStore.getState().showNotification('Employment status updated successfully', 'success');

      return { success: true };
    } catch (error) {
      const technicalMessage = error instanceof Error ? error.message : 'Failed to update employment status';
      const userFriendlyMessage = getUserFriendlyErrorMessage(technicalMessage);
      console.error('Error updating employment status:', error);

      set({
        loading: false,
        error: technicalMessage,
      });

      useUIStore.getState().showNotification(userFriendlyMessage, 'error');

      return { success: false, error: userFriendlyMessage };
    }
  },

  setSelectedEmployee: (employee) => {
    set({ selectedEmployee: employee });
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    }));
  },

  setPagination: (page, itemsPerPage) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        currentPage: page,
        itemsPerPage: itemsPerPage || state.pagination.itemsPerPage,
      },
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        search: '',
        status: 'all',
        primaryRegion: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      },
    });
  },

  clearError: () => {
    set({ error: null });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  refetch: async () => {
    await get().fetchEmployees();
  },
}));