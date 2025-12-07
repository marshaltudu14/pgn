import { create } from 'zustand';
import { Employee, EmploymentStatus, EmployeeListParams, EmployeeListResponse, CreateEmployeeRequest, UpdateEmployeeRequest, ChangeEmploymentStatusRequest } from '@pgn/shared';
import { useUIStore } from './uiStore';
import { useAuthStore } from './authStore';
import { handleApiResponse, getAuthHeaders } from './utils/errorHandling';



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
    searchField: SearchFieldType;
    status: EmploymentStatus | 'all';
    assigned_regions?: string[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };

  fetchEmployees: (params?: EmployeeListParams) => Promise<void>;
  createEmployee: (employeeData: CreateEmployeeRequest) => Promise<{ success: boolean; error?: string; data?: Employee }>;
  updateEmployee: (id: string, employeeData: UpdateEmployeeRequest) => Promise<{ success: boolean; error?: string; data?: Employee }>;
  deleteEmployee: (id: string) => Promise<{ success: boolean; error?: string }>;
  resetEmployeePassword: (id: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateEmploymentStatus: (id: string, request: ChangeEmploymentStatusRequest) => Promise<{ success: boolean; error?: string }>;
  setSelectedEmployee: (employee: Employee | null) => void;
  setFilters: (filters: Partial<EmployeeFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
  setError: (error: string | null) => void;
  clearFilters: () => void;
  refetch: () => Promise<void>;
}

type SearchFieldType =
  | 'human_readable_user_id'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone';

interface EmployeeFilters {
  search?: string;
  searchField?: SearchFieldType;
  status?: EmploymentStatus | 'all';
  assigned_regions?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}


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
    searchField: 'first_name',
    status: 'all',
    sortBy: 'first_name',
    sortOrder: 'asc',
  },

  fetchEmployees: async (params?: EmployeeListParams) => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const queryParams: EmployeeListParams = {
        page: params?.page || pagination.currentPage,
        limit: params?.limit || pagination.itemsPerPage,
        search: params?.search || filters.search || undefined,
        search_field: params?.search_field || filters.searchField,
        employment_status: params?.employment_status || (filters.status !== 'all' ? [filters.status as EmploymentStatus] : undefined),
        assigned_regions: params?.assigned_regions || filters.assigned_regions,
        sort_by: params?.sort_by || filters.sortBy,
        sort_order: params?.sort_order || filters.sortOrder,
      };

      const queryString = new URLSearchParams();
      if (queryParams.page) queryString.set('page', queryParams.page.toString());
      if (queryParams.limit) queryString.set('limit', queryParams.limit.toString());
      if (queryParams.search) queryString.set('search', queryParams.search);
      if (queryParams.search_field) queryString.set('search_field', queryParams.search_field);
      if (queryParams.employment_status) {
        // Add each status as separate array parameter for proper API validation
        queryParams.employment_status.forEach(status => {
          queryString.append('employment_status[]', status);
        });
      }
      if (queryParams.assigned_regions && queryParams.assigned_regions.length > 0) {
        // Add each region as separate array parameter for proper API validation
        queryParams.assigned_regions.forEach(regionId => {
          queryString.append('assigned_regions[]', regionId);
        });
      }
      if (queryParams.sort_by) queryString.set('sort_by', queryParams.sort_by);
      if (queryParams.sort_order) queryString.set('sort_order', queryParams.sort_order);

      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/employees?${queryString}`, {
        headers: getAuthHeaders(token),
      });

      const result = await handleApiResponse(response, 'Failed to fetch employees');

      if (!result.success) {
        set({
          loading: false,
          error: result.error || 'Failed to fetch employees',
          employees: [],
        });
        useUIStore.getState().showNotification(result.error || 'Failed to fetch employees', 'error');
        return;
      }

      const data: EmployeeListResponse = result.data as EmployeeListResponse;
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
      console.error('Error fetching employees:', error);
      set({
        loading: false,
        error: 'Failed to fetch employees',
        employees: [],
      });
      useUIStore.getState().showNotification('Failed to fetch employees', 'error');
    }
  },

  createEmployee: async (employeeData: CreateEmployeeRequest) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(employeeData),
      });

      const result = await handleApiResponse(response, 'Failed to create employee');

      if (!result.success) {
        set({
          loading: false,
          error: result.error || 'Failed to create employee',
        });
        useUIStore.getState().showNotification(result.error || 'Failed to create employee', 'error');
        return { success: false, error: result.error };
      }

      const newEmployee: Employee = result.data as Employee;

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
      console.error('Error creating employee:', error);

      set({
        loading: false,
        error: 'Failed to create employee',
      });

      useUIStore.getState().showNotification('Failed to create employee', 'error');

      return { success: false, error: 'Failed to create employee' };
    }
  },

  updateEmployee: async (id: string, employeeData: UpdateEmployeeRequest) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(employeeData),
      });

      const result = await handleApiResponse(response, 'Failed to update employee');

      if (!result.success) {
        set({
          loading: false,
          error: result.error || 'Failed to update employee',
        });
        useUIStore.getState().showNotification(result.error || 'Failed to update employee', 'error');
        return { success: false, error: result.error };
      }

      const updatedEmployee: Employee = result.data as Employee;

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
      console.error('Error updating employee:', error);

      set({
        loading: false,
        error: 'Failed to update employee',
      });

      useUIStore.getState().showNotification('Failed to update employee', 'error');

      return { success: false, error: 'Failed to update employee' };
    }
  },

  resetEmployeePassword: async (id, newPassword) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/employees/${id}`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ newPassword }),
      });

      const result = await handleApiResponse(response, 'Failed to reset password');

      if (!result.success) {
        set({
          loading: false,
          error: result.error || 'Failed to reset password',
        });
        useUIStore.getState().showNotification(result.error || 'Failed to reset password', 'error');
        return { success: false, error: result.error };
      }

      set({ loading: false, error: null });
      useUIStore.getState().showNotification('Password reset successfully', 'success');

      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);

      set({
        loading: false,
        error: 'Failed to reset password',
      });

      useUIStore.getState().showNotification('Failed to reset password', 'error');

      return { success: false, error: 'Failed to reset password' };
    }
  },

  updateEmploymentStatus: async (id: string, request: ChangeEmploymentStatusRequest) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/employees/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(request),
      });

      const result = await handleApiResponse(response, 'Failed to update employment status');

      if (!result.success) {
        set({
          loading: false,
          error: result.error || 'Failed to update employment status',
        });
        useUIStore.getState().showNotification(result.error || 'Failed to update employment status', 'error');
        return { success: false, error: result.error };
      }

      const updatedEmployee: Employee = result.data as Employee;

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
      console.error('Error updating employment status:', error);

      set({
        loading: false,
        error: 'Failed to update employment status',
      });

      useUIStore.getState().showNotification('Failed to update employment status', 'error');

      return { success: false, error: 'Failed to update employment status' };
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

  clearError: () => {
    set({ error: null });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearFilters: () => {
    const currentFilters = get().filters;
    set({
      filters: {
        search: '',
        searchField: 'first_name',
        status: 'all',
        assigned_regions: currentFilters.assigned_regions, // Preserve the selected regions
        sortBy: 'first_name',
        sortOrder: 'asc',
      },
    });
  },

  deleteEmployee: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      const result = await handleApiResponse(response, 'Failed to delete employee');

      if (!result.success) {
        set({
          loading: false,
          error: result.error || 'Failed to delete employee',
        });
        useUIStore.getState().showNotification(result.error || 'Failed to delete employee', 'error');
        return { success: false, error: result.error };
      }

      // Optimistically remove from the list
      set((state) => ({
        employees: state.employees.filter((emp) => emp.id !== id),
        selectedEmployee: state.selectedEmployee?.id === id ? null : state.selectedEmployee,
        loading: false,
        error: null,
      }));

      useUIStore.getState().showNotification('Employee deleted successfully', 'success');

      // Refresh to get updated pagination
      await get().fetchEmployees();

      return { success: true };
    } catch (error) {
      console.error('Error deleting employee:', error);

      set({
        loading: false,
        error: 'Failed to delete employee',
      });

      useUIStore.getState().showNotification('Failed to delete employee', 'error');

      return { success: false, error: 'Failed to delete employee' };
    }
  },

  refetch: async () => {
    await get().fetchEmployees();
  },
}));