import { create } from 'zustand';
import { Employee, EmploymentStatus, PaginationInfo } from '@pgn/shared';
import { useUIStore } from './uiStore';

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  pagination: PaginationInfo;
  filters: {
    search: string;
    status: string;
  };

  fetchEmployees: (page?: number, filters?: Partial<{ search: string; status: string }>) => Promise<void>;
  createEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateEmployee: (id: string, employeeData: Partial<Employee>) => Promise<{ success: boolean; error?: string }>;
  updateEmploymentStatus: (id: string, status: EmploymentStatus, reason?: string) => Promise<{ success: boolean; error?: string }>;
  setSelectedEmployee: (employee: Employee | null) => void;
  setFilters: (filters: Partial<{ search: string; status: string }>) => void;
  clearFilters: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  selectedEmployee: null,
  loading: false,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  filters: {
    search: '',
    status: '',
  },

  fetchEmployees: async (page = 1, filters) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters?.search && { search: filters.search }),
        ...(filters?.status && { status: filters.status }),
      });

      // TODO: Create this API route - for now using placeholder
      const response = await fetch(`/api/employees?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch employees');
      }

      set({
        employees: data.employees || [],
        pagination: data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      useUIStore.getState().showNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch employees',
      });
      set({ loading: false });
    }
  },

  createEmployee: async (employeeData) => {
    try {
      // TODO: Create this API route - for now using placeholder
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create employee');
      }

      useUIStore.getState().showNotification({
        type: 'success',
        title: 'Success',
        message: 'Employee created successfully',
      });

      // Refresh the employee list
      await get().fetchEmployees();

      return { success: true };
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create employee';

      useUIStore.getState().showNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  },

  updateEmployee: async (id, employeeData) => {
    try {
      // TODO: Create this API route - for now using placeholder
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update employee');
      }

      useUIStore.getState().showNotification({
        type: 'success',
        title: 'Success',
        message: 'Employee updated successfully',
      });

      // Refresh the employee list
      await get().fetchEmployees();

      return { success: true };
    } catch (error) {
      console.error('Error updating employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employee';

      useUIStore.getState().showNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  },

  updateEmploymentStatus: async (id, status, reason) => {
    try {
      // TODO: Create this API route - for now using placeholder
      const response = await fetch(`/api/employees/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update employment status');
      }

      useUIStore.getState().showNotification({
        type: 'success',
        title: 'Success',
        message: 'Employment status updated successfully',
      });

      // Refresh the employee list
      await get().fetchEmployees();

      return { success: true };
    } catch (error) {
      console.error('Error updating employment status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employment status';

      useUIStore.getState().showNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });

      return { success: false, error: errorMessage };
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

  clearFilters: () => {
    set({
      filters: {
        search: '',
        status: '',
      },
    });
  },
}));