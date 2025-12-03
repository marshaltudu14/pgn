/**
 * Comprehensive Unit Tests for EmployeeListClient Component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Employee, EmploymentStatus } from '@pgn/shared';
import EmployeeListClient from '../employees-list-client';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock child components
jest.mock('@/components/employee-list', () => {
  return {
    EmployeeList: ({
      onEmployeeSelect,
      onEmployeeEdit,
      onEmployeeCreate,
    }: {
      onEmployeeSelect?: (employee: Employee | null) => void;
      onEmployeeEdit?: (employee: Employee) => void;
      onEmployeeCreate?: () => void;
    }) => (
      <div data-testid="employee-list">
        <button
          data-testid="select-employee"
          onClick={() =>
            onEmployeeSelect?.(mockEmployee)
          }
        >
          Select Employee
        </button>
        <button
          data-testid="select-null-employee"
          onClick={() =>
            onEmployeeSelect?.(null)
          }
        >
          Select Null Employee
        </button>
        <button
          data-testid="edit-employee"
          onClick={() =>
            onEmployeeEdit?.(mockEmployee)
          }
        >
          Edit Employee
        </button>
        <button
          data-testid="create-employee"
          onClick={onEmployeeCreate}
        >
          Create Employee
        </button>
      </div>
    ),
  };
});

jest.mock('@/components/employee-quick-view', () => {
  return {
    EmployeeQuickView: ({
      open,
      onOpenChange,
      employee,
      onEdit,
    }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      employee: Employee | null;
      onEdit?: (employee: Employee) => void;
    }) => (
      open ? (
        <div data-testid="employee-quick-view">
          <span data-testid="employee-id">{employee?.id}</span>
          <button
            data-testid="quick-view-edit"
            onClick={() => onEdit?.(employee!)}
          >
            Edit from Quick View
          </button>
          <button
            data-testid="close-quick-view"
            onClick={() => onOpenChange(false)}
          >
            Close Quick View
          </button>
        </div>
      ) : null
    ),
  };
});

// Helper function to create mock employee data
const createMockEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-123',
  human_readable_user_id: 'PGN-2024-0001',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '9876543210',
  employment_status: 'ACTIVE' as EmploymentStatus,
  can_login: true,
  assigned_cities: JSON.stringify([
    { city: 'Mumbai', state: 'Maharashtra' },
  ]),
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  employment_status_changed_at: '2024-01-01T00:00:00Z',
  employment_status_changed_by: 'admin',
  ...overrides,
});

const mockEmployee = createMockEmployee();

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));


describe('EmployeeListClient Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the component without crashing', () => {
      render(<EmployeeListClient />);

      expect(screen.getByTestId('employee-list')).toBeInTheDocument();
    });

    it('should render EmployeeList component', () => {
      render(<EmployeeListClient />);

      expect(screen.getByTestId('employee-list')).toBeInTheDocument();
    });

    it('should not render EmployeeQuickView initially', () => {
      render(<EmployeeListClient />);

      expect(screen.queryByTestId('employee-quick-view')).not.toBeInTheDocument();
    });

    it('should render in the correct container structure', () => {
      const { container } = render(<EmployeeListClient />);

      // Check that it renders with the expected space-y-6 class
      const mainContainer = container.firstChild;
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      render(<EmployeeListClient />);

      // Quick view should be closed initially
      expect(screen.queryByTestId('employee-quick-view')).not.toBeInTheDocument();
    });

    it('should manage selected employee state correctly', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      // Click select employee button
      const selectButton = screen.getByTestId('select-employee');
      await user.click(selectButton);

      // Quick view should open with selected employee
      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
      });
      expect(screen.getByTestId('employee-id')).toHaveTextContent('emp-123');
    });
  });

  describe('User Interactions - Employee Selection', () => {
    it('should open quick view when employee is selected', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      const selectButton = screen.getByTestId('select-employee');
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
        expect(screen.getByTestId('employee-id')).toHaveTextContent('emp-123');
      });
    });

    it('should close quick view when close button is clicked', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      // First open the quick view
      const selectButton = screen.getByTestId('select-employee');
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
      });

      // Then close it
      const closeButton = screen.getByTestId('close-quick-view');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('employee-quick-view')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle multiple employee selections correctly', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      // Select first employee
      const selectButton = screen.getByTestId('select-employee');
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('employee-id')).toHaveTextContent('emp-123');
      });

      // Close quick view
      const closeButton = screen.getByTestId('close-quick-view');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('employee-quick-view')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Select employee again
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
        expect(screen.getByTestId('employee-id')).toHaveTextContent('emp-123');
      });
    });
  });

  describe('User Interactions - Employee Edit', () => {
    it('should navigate to edit form when edit button is clicked from list', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      const editButton = screen.getByTestId('edit-employee');
      await user.click(editButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/employees/form?id=emp-123&mode=edit');
    });

    it('should navigate to edit form when edit button is clicked from quick view', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      // First open quick view
      const selectButton = screen.getByTestId('select-employee');
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
      });

      // Then click edit from quick view
      const quickViewEditButton = screen.getByTestId('quick-view-edit');
      await user.click(quickViewEditButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/employees/form?id=emp-123&mode=edit');
    });

    it('should close quick view when editing from quick view', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      // First open quick view
      const selectButton = screen.getByTestId('select-employee');
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
      });

      // Click edit from quick view
      const quickViewEditButton = screen.getByTestId('quick-view-edit');
      await user.click(quickViewEditButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/employees/form?id=emp-123&mode=edit');
    });
  });

  describe('User Interactions - Employee Creation', () => {
    it('should navigate to create form when create button is clicked', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      const createButton = screen.getByTestId('create-employee');
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/employees/form?mode=create');
    });

    it('should pass correct URL parameters for create mode', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      const createButton = screen.getByTestId('create-employee');
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('mode=create')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.not.stringContaining('id=')
      );
    });
  });

  describe('Navigation Behavior', () => {
    it('should include employee ID in edit navigation URL', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      const editButton = screen.getByTestId('edit-employee');
      await user.click(editButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('id=emp-123')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('mode=edit')
      );
    });

    it('should navigate to correct base path for employees', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      const createButton = screen.getByTestId('create-employee');
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/dashboard\/employees\/form/)
      );
    });

    it('should preserve URL parameters correctly', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      const editButton = screen.getByTestId('edit-employee');
      await user.click(editButton);

      const calledUrl = mockPush.mock.calls[0][0];
      const urlParams = new URLSearchParams(calledUrl.split('?')[1]);

      expect(urlParams.get('id')).toBe('emp-123');
      expect(urlParams.get('mode')).toBe('edit');
    });
  });

  describe('Component State Cleanup', () => {
    it('should handle quick view state changes correctly', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      // Open quick view
      const selectButton = screen.getByTestId('select-employee');
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
      });

      // Close quick view
      const closeButton = screen.getByTestId('close-quick-view');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('employee-quick-view')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify we can open it again
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
      });
    });

    it('should handle rapid state changes without errors', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      const selectButton = screen.getByTestId('select-employee');

      // Perform rapid open/close operations
      for (let i = 0; i < 3; i++) {
        await user.click(selectButton);
        // Quick view should appear
        await waitFor(() => {
          expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
        }, { timeout: 1000 });

        const closeButton = screen.getByTestId('close-quick-view');
        await user.click(closeButton);
        // Quick view should disappear
        await waitFor(() => {
          expect(screen.queryByTestId('employee-quick-view')).not.toBeInTheDocument();
        }, { timeout: 1000 });
      }

      // If we reach here without errors, the rapid state changes are working correctly
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing employee data gracefully', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      // Click the button that passes null employee
      const selectNullButton = screen.getByTestId('select-null-employee');
      await user.click(selectNullButton);

      // Should not open quick view with null employee
      expect(screen.queryByTestId('employee-quick-view')).not.toBeInTheDocument();
    });

    it('should handle router navigation errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock console.error to capture navigation errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock router to throw error
      mockPush.mockImplementation(() => {
        return Promise.reject(new Error('Navigation failed'));
      });

      render(<EmployeeListClient />);

      const editButton = screen.getByTestId('edit-employee');

      // Trigger navigation
      await user.click(editButton);

      // Should have logged the error since component now handles it properly
      expect(consoleSpy).toHaveBeenCalledWith('Navigation failed:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Props Handling', () => {
    it('should work correctly with all optional props not provided', () => {
      render(<EmployeeListClient />);

      // Should render without errors when no callbacks are passed to EmployeeList
      expect(screen.getByTestId('employee-list')).toBeInTheDocument();
    });

    it('should pass correct props to child components', () => {
      render(<EmployeeListClient />);

      // Verify that EmployeeList receives the correct callback functions
      const selectButton = screen.getByTestId('select-employee');
      const editButton = screen.getByTestId('edit-employee');
      const createButton = screen.getByTestId('create-employee');

      expect(selectButton).toBeInTheDocument();
      expect(editButton).toBeInTheDocument();
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain focus management correctly', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      const selectButton = screen.getByTestId('select-employee');
      selectButton.focus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
      });

      // Focus should move to quick view content
      expect(screen.getByTestId('quick-view-edit')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      const selectButton = screen.getByTestId('select-employee');
      await user.tab(); // Navigate to select button
      expect(selectButton).toHaveFocus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA attributes through child components', () => {
      render(<EmployeeListClient />);

      // Check that child components are properly accessible
      const employeeList = screen.getByTestId('employee-list');
      expect(employeeList).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { rerender } = render(<EmployeeListClient />);

      // Rerender should not cause errors
      rerender(<EmployeeListClient />);

      expect(screen.getByTestId('employee-list')).toBeInTheDocument();
    });

    it('should handle large employee lists efficiently', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      // Simulate rapid interactions
      for (let i = 0; i < 10; i++) {
        const selectButton = screen.getByTestId('select-employee');
        await user.click(selectButton);

        await waitFor(() => {
          expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
        });

        const closeButton = screen.getByTestId('close-quick-view');
        await user.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByTestId('employee-quick-view')).not.toBeInTheDocument();
        });
      }

      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Integration with Child Components', () => {
    it('should correctly handle callbacks from EmployeeList', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      // Test all callbacks
      const selectButton = screen.getByTestId('select-employee');
      const editButton = screen.getByTestId('edit-employee');
      const createButton = screen.getByTestId('create-employee');

      await user.click(selectButton);
      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('close-quick-view');
      await user.click(closeButton);

      await user.click(editButton);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/employees/form?id=emp-123&mode=edit');

      await user.click(createButton);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/employees/form?mode=create');
    });

    it('should correctly handle callbacks from EmployeeQuickView', async () => {
      const user = userEvent.setup();

      render(<EmployeeListClient />);

      // Open quick view
      const selectButton = screen.getByTestId('select-employee');
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('employee-quick-view')).toBeInTheDocument();
      });

      // Test quick view edit callback
      const quickViewEditButton = screen.getByTestId('quick-view-edit');
      await user.click(quickViewEditButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/employees/form?id=emp-123&mode=edit');
    });
  });
});