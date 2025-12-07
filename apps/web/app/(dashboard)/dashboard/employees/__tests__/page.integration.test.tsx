/**
 * Integration Tests for Employee Dashboard Page
 * Tests the complete page including all components, routing, and user flows
 */

import React from 'react';
import '@testing-library/jest-dom';
import { Employee, EmploymentStatus } from '@pgn/shared';


// Mock the EmployeeList component for testing
jest.mock('@/components/employee-list', () => {
  const { useEffect } = React;
  return {
    EmployeeList: ({ onEmployeeSelect: _onEmployeeSelect, onEmployeeEdit, onEmployeeCreate }: {
      onEmployeeSelect?: (employee: Employee) => void;
      onEmployeeEdit?: (employee: Employee) => void;
      onEmployeeCreate?: () => void;
    }) => {
      // Use the mock fetchEmployees function from the outer scope
      const mockFetchEmployees = ((global as unknown) as Record<string, unknown>).mockFetchEmployees as jest.Mock || jest.fn();

      // Call fetchEmployees to simulate the real component behavior
      useEffect(() => {
        mockFetchEmployees();
      }, [mockFetchEmployees]);

      return (
        <div data-testid="employee-list">
          Employee List Component
          <button data-testid="edit-employee" onClick={() => onEmployeeEdit?.(mockEmployees[0])}>Edit</button>
          <button data-testid="create-employee" onClick={onEmployeeCreate}>Create</button>
        </div>
      );
    },
  };
});

// Mock Next.js components and router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard/employees',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js metadata
jest.mock('next', () => ({
  Metadata: {},
}));

// Mock the employee store for integration testing
const mockFetchEmployees = jest.fn();
const mockSetFilters = jest.fn();
const mockSetPagination = jest.fn();
const mockClearError = jest.fn();

// Make mock functions available globally for component mocks
(global as unknown as Record<string, unknown>).mockFetchEmployees = mockFetchEmployees;
(global as unknown as Record<string, unknown>).mockSetFilters = mockSetFilters;
(global as unknown as Record<string, unknown>).mockSetPagination = mockSetPagination;
(global as unknown as Record<string, unknown>).mockClearError = mockClearError;

jest.mock('@/app/lib/stores/employeeStore', () => ({
  useEmployeeStore: () => ({
    employees: mockEmployees,
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 2,
      totalItems: 25,
      itemsPerPage: 20,
      hasNextPage: true,
      hasPreviousPage: false,
    },
    filters: {
      search: '',
      status: 'all' as const,
      sortBy: 'created_at',
      sortOrder: 'desc' as const,
    },
    fetchEmployees: mockFetchEmployees,
    setFilters: mockSetFilters,
    setPagination: mockSetPagination,
    clearError: mockClearError,
    setSelectedEmployee: jest.fn(),
    clearFilters: jest.fn(),
    setError: jest.fn(),
    refetch: mockFetchEmployees,
    createEmployee: jest.fn(),
    updateEmployee: jest.fn(),
    updateEmploymentStatus: jest.fn(),
    resetEmployeePassword: jest.fn(),
    selectedEmployee: null,
  }),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Sample test data
const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    human_readable_user_id: 'PGN-2024-0001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    employment_status: 'ACTIVE' as EmploymentStatus,
    can_login: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    employment_status_changed_at: '2024-01-01T00:00:00Z',
    employment_status_changed_by: 'admin',
  }
];
