/**
 * Comprehensive Integration Tests for Employees Page
 * Tests complete employee management workflow including API integration, routing, and component interactions
 */

import React from 'react';
import '@testing-library/jest-dom';
import { Employee, EmploymentStatus } from '@pgn/shared';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock the employee store
const mockFetchEmployees = jest.fn().mockResolvedValue(undefined);
const mockSetFilters = jest.fn();
const mockSetPagination = jest.fn();
const mockClearError = jest.fn();

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
      searchField: 'human_readable_user_id' as const,
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

// Mock the UI components with test IDs
jest.mock('@/components/employee-list', () => {
  return {
    EmployeeList: ({ onEmployeeSelect, onEmployeeEdit, onEmployeeCreate }: {
      onEmployeeSelect?: (employee: Employee) => void;
      onEmployeeEdit?: (employee: Employee) => void;
      onEmployeeCreate?: () => void;
    }) => (
      <div data-testid="employee-list">
        <div data-testid="employee-list-header">
          <h2>Employees</h2>
          <p>25 employees found</p>
        </div>

        <div data-testid="employee-controls">
          <button
            data-testid="create-employee-btn"
            onClick={onEmployeeCreate}
          >
            Add Employee
          </button>

          <input
            data-testid="search-input"
            placeholder="Search employees..."
            onChange={(e) => mockSetFilters({ search: e.target.value })}
          />

          <select
            data-testid="status-filter"
            onChange={(e) => mockSetFilters({ status: e.target.value as EmploymentStatus | 'all' })}
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div data-testid="employee-table">
          {mockEmployees.map((employee) => (
            <div key={employee.id} data-testid={`employee-row-${employee.id}`}>
              <span data-testid={`employee-id-${employee.id}`}>{employee.human_readable_user_id}</span>
              <span data-testid={`employee-name-${employee.id}`}>{employee.first_name} {employee.last_name}</span>
              <span data-testid={`employee-email-${employee.id}`}>{employee.email}</span>
              <span data-testid={`employee-status-${employee.id}`}>{employee.employment_status}</span>

              <button
                data-testid={`view-employee-${employee.id}`}
                onClick={() => onEmployeeSelect?.(employee)}
              >
                View
              </button>

              <button
                data-testid={`edit-employee-${employee.id}`}
                onClick={() => onEmployeeEdit?.(employee)}
              >
                Edit
              </button>
            </div>
          ))}
        </div>

        <div data-testid="pagination-controls">
          <button
            data-testid="prev-page-btn"
            disabled={true}
            onClick={() => mockSetPagination(1)}
          >
            Previous
          </button>
          <span data-testid="page-info">Page 1 of 2</span>
          <button
            data-testid="next-page-btn"
            onClick={() => mockSetPagination(2)}
          >
            Next
          </button>
        </div>
      </div>
    ),
  };
});

jest.mock('@/components/employee-quick-view', () => {
  return {
    EmployeeQuickView: ({ open, employee, onEdit, onOpenChange }: {
      open: boolean;
      employee: Employee | null;
      onEdit?: (employee: Employee) => void;
      onOpenChange: (open: boolean) => void;
    }) => (
      open ? (
        <div data-testid="employee-quick-view">
          <h3 data-testid="quick-view-title">Employee Quick View</h3>
          {employee && (
            <div>
              <p data-testid="quick-view-id">{employee.human_readable_user_id}</p>
              <p data-testid="quick-view-name">{employee.first_name} {employee.last_name}</p>
              <p data-testid="quick-view-email">{employee.email}</p>
              <p data-testid="quick-view-status">{employee.employment_status}</p>

              <button
                data-testid="quick-view-edit-btn"
                onClick={() => onEdit?.(employee)}
              >
                Edit Employee
              </button>

              <button
                data-testid="quick-view-close-btn"
                onClick={() => onOpenChange(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      ) : null
    ),
  };
});

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
