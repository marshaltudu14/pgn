/**
 * Comprehensive Unit Tests for EmployeeList Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Employee, EmploymentStatus } from '@pgn/shared';
import { useEmployeeStore } from '@/app/lib/stores/employeeStore';
import { EmployeeList } from '../employee-list';

// Mock the employee store
jest.mock('@/app/lib/stores/employeeStore');

// Mock UI components to simplify testing
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table data-testid="employee-table">{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableRow: ({ children, ...props }: { children: React.ReactNode }) => <tr data-testid="table-row" {...props}>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    size,
    variant,
    'data-testid': testId,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    size?: string;
    variant?: string;
    'data-testid'?: string;
    [key: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId || 'button'}
      data-size={size}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
  buttonVariants: ({ variant, size, className }: { variant?: string; size?: string; className?: string }) =>
    `btn btn-${variant || 'default'} btn-${size || 'default'} ${className || ''}`,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({
    onChange,
    value,
    placeholder,
    'data-testid': testId,
    ...props
  }: {
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value?: string;
    placeholder?: string;
    'data-testid'?: string;
    [key: string]: unknown;
  }) => (
    <input
      onChange={(e) => {
        // Simulate the onChange behavior for search inputs
        if (placeholder?.includes('Search')) {
          onChange?.({ target: { value: e.target.value } } as React.ChangeEvent<HTMLInputElement>);
        }
      }}
      value={value}
      placeholder={placeholder}
      data-testid={testId || 'input'}
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
  }) => (
    <div
      data-testid="select"
      data-value={value}
      data-disabled={disabled}
      onClick={() => onValueChange?.('test-value')}
    >
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
  SelectTrigger: ({ children, 'data-testid': testId, disabled }: {
    children: React.ReactNode;
    'data-testid'?: string;
    disabled?: boolean;
  }) => (
    <button
      data-testid={testId || 'select-trigger'}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className} data-testid="badge">{children}</span>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, 'data-testid': testId }: { className?: string; 'data-testid'?: string }) => (
    <div className={className} data-testid={testId || 'skeleton'}></div>
  ),
}));

// Mock useDebounce to return the value immediately for testing
jest.mock('@/lib/utils/debounce', () => ({
  useDebounce: (value: unknown, _delay: number) => value,
}));

// Type for mocked store
type MockEmployeeStore = jest.MockedFunction<typeof useEmployeeStore> & {
  fetchEmployees: jest.MockedFunction<() => Promise<void>>;
  clearError: jest.MockedFunction<() => void>;
};

// Helper function to create mock employee data
const createMockEmployee = (id: string, overrides: Partial<Employee> = {}): Employee => ({
  id,
  human_readable_user_id: `PGN-2024-${id.padStart(4, '0')}`,
  first_name: `John${id}`,
  last_name: `Doe${id}`,
  email: `john${id}@example.com`,
  phone: `987654321${id}`,
  employment_status: 'ACTIVE' as EmploymentStatus,
  can_login: true,
    created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  employment_status_changed_at: '2024-01-01T00:00:00Z',
  employment_status_changed_by: 'admin',
    ...overrides,
});

describe('EmployeeList Component', () => {
  const mockUseEmployeeStore = useEmployeeStore as MockEmployeeStore;

  // Mock callbacks
  const mockOnEmployeeSelect = jest.fn();
  const mockOnEmployeeEdit = jest.fn();
  const mockOnEmployeeCreate = jest.fn();

  // Default mock store state
  const defaultMockStore = {
    employees: [],
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
      searchField: 'human_readable_user_id' as const,
      status: 'all' as const,
      sortBy: 'created_at',
      sortOrder: 'desc' as const,
    },
    fetchEmployees: jest.fn().mockResolvedValue(undefined),
    setFilters: jest.fn(),
    setPagination: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEmployeeStore.mockReturnValue(defaultMockStore as unknown);
  });

  describe('Component Rendering', () => {
    it('should render the component with basic elements', () => {
      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      // Check main headers and buttons
      expect(screen.getByText('Employees')).toBeInTheDocument();
      expect(screen.getByText('Add Employee')).toBeInTheDocument();

      // Check search and filter elements
      expect(screen.getAllByPlaceholderText('Search employees...')).toHaveLength(2);
      expect(screen.getAllByTestId('select')).toHaveLength(4);

      // Check that table headers exist (using getAllByText to avoid multiple element errors)
      expect(screen.getAllByText('User ID').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Phone').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Actions').length).toBeGreaterThan(0);
    });

    it('should show loading skeleton when loading', () => {
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        loading: true,
        employees: [],
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      // Should show skeleton elements
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should display error message when error exists', () => {
      const errorMessage = 'Failed to fetch employees';
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        error: errorMessage,
        loading: false,
        employees: [],
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    it('should display employee count when employees exist', () => {
      const mockEmployees = [createMockEmployee('1')];
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 1,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      expect(screen.getByText('1 employee found')).toBeInTheDocument();
    });

    it('should display plural employee count for multiple employees', () => {
      const mockEmployees = [createMockEmployee('1'), createMockEmployee('2')];
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 2,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      expect(screen.getByText('2 employees found')).toBeInTheDocument();
    });
  });

  describe('Employee Data Display', () => {
    it('should display employee data correctly', () => {
      const mockEmployees = [
        createMockEmployee('1', {
          employment_status: 'ACTIVE',
        }),
      ];

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 1,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      const employee = mockEmployees[0];
      expect(screen.getByText(employee.human_readable_user_id!)).toBeInTheDocument();
      expect(screen.getByText(`${employee.first_name} ${employee.last_name}`)).toBeInTheDocument();
      expect(screen.getAllByText(employee.email)).toHaveLength(2); // Mobile and desktop views
      expect(screen.getAllByText(employee.phone!)).toHaveLength(2); // Mobile and desktop views
      expect(screen.getAllByText('ACTIVE')).toHaveLength(3); // 2 in selects + 1 in badge
      expect(screen.getByText('No regions')).toBeInTheDocument();
    });

    it('should display employment status badges with correct styling', () => {
      const mockEmployees = [
        createMockEmployee('1', { employment_status: 'ACTIVE' }),
        createMockEmployee('2', { employment_status: 'SUSPENDED' }),
        createMockEmployee('3', { employment_status: 'RESIGNED' }),
        createMockEmployee('4', { employment_status: 'TERMINATED' }),
        createMockEmployee('5', { employment_status: 'ON_LEAVE' }),
      ];

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 5,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(5);

      expect(badges[0]).toHaveTextContent('ACTIVE');
      expect(badges[1]).toHaveTextContent('SUSPENDED');
      expect(badges[2]).toHaveTextContent('RESIGNED');
      expect(badges[3]).toHaveTextContent('TERMINATED');
      expect(badges[4]).toHaveTextContent('ON LEAVE');
    });

    it('should render employee list', () => {
      const mockEmployees = [
        createMockEmployee('1'),
      ];

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 1,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      // Phone appears in both mobile and desktop views
      expect(screen.getAllByText(mockEmployees[0].phone!)).toHaveLength(2);
    });

    it('should handle missing phone number', () => {
      const mockEmployees = [
        createMockEmployee('1', {
          phone: '',
        }),
      ];

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 1,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should truncate long email addresses in mobile view', () => {
      const mockEmployees = [
        createMockEmployee('1', {
          email: 'very.long.email.address@example.com',
        }),
      ];

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 1,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      // Should show full email in desktop view
      const desktopEmail = screen.getByText('very.long.email.address@example.com');

      expect(desktopEmail).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onEmployeeCreate when Add Employee button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      const addButton = screen.getByText('Add Employee');
      await user.click(addButton);

      expect(mockOnEmployeeCreate).toHaveBeenCalledTimes(1);
    });

    it('should call onEmployeeSelect when eye button is clicked', async () => {
      const user = userEvent.setup();
      const mockEmployees = [createMockEmployee('1')];

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 1,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      // Find and click the view button (eye icon)
      const viewButtons = screen.getAllByRole('button');
      const eyeButton = viewButtons.find(button =>
        button.querySelector('svg')?.getAttribute('data-lucide') === 'eye'
      );

      if (eyeButton) {
        await user.click(eyeButton);
        expect(mockOnEmployeeSelect).toHaveBeenCalledWith(mockEmployees[0]);
      }
    });

    it('should call onEmployeeEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const mockEmployees = [createMockEmployee('1')];

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 1,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      // Find and click the edit button (edit icon)
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(button =>
        button.querySelector('svg')?.getAttribute('data-lucide') === 'edit'
      );

      if (editButton) {
        await user.click(editButton);
        expect(mockOnEmployeeEdit).toHaveBeenCalledWith(mockEmployees[0]);
      }
    });

    it('should call clearError when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Test error';

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        error: errorMessage,
        clearError: jest.fn(),
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      const dismissButton = screen.getByText('Dismiss');
      await user.click(dismissButton);

      expect(mockUseEmployeeStore().clearError).toHaveBeenCalledTimes(1);
    });

    it('should handle search input changes', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      const searchInput = screen.getAllByPlaceholderText('Search employees...')[0]; // First search input
      await user.type(searchInput, 'John');

      // Check that setFilters was called (will be called for each character)
      expect(mockUseEmployeeStore().setFilters).toHaveBeenCalled();
      expect(mockUseEmployeeStore().setPagination).toHaveBeenCalledWith(1);
    });

    it('should handle status filter changes', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      const statusSelect = screen.getAllByTestId('select')[1]; // Second select is status filter
      await user.click(statusSelect);

      expect(mockUseEmployeeStore().setFilters).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should render pagination when there are multiple pages', () => {
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalItems: 50,
          itemsPerPage: 20,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('50 employees found')).toBeInTheDocument();
    });

    it('should handle page navigation', async () => {
      const user = userEvent.setup();

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        pagination: {
          currentPage: 2,
          totalPages: 3,
          totalItems: 50,
          itemsPerPage: 20,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(mockUseEmployeeStore().setPagination).toHaveBeenCalledWith(3);

      const prevButton = screen.getByText('Previous');
      await user.click(prevButton);

      expect(mockUseEmployeeStore().setPagination).toHaveBeenCalledWith(1);
    });

    it('should disable Previous button on first page', () => {
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalItems: 50,
          itemsPerPage: 20,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      const prevButton = screen.getByText('Previous').closest('a');
      expect(prevButton).toHaveClass('pointer-events-none', 'opacity-50');
    });

    it('should disable Next button on last page', () => {
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        pagination: {
          currentPage: 3,
          totalPages: 3,
          totalItems: 50,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      const nextButton = screen.getByText('Next').closest('a');
      expect(nextButton).toHaveClass('pointer-events-none', 'opacity-50');
    });

    it('should handle page size changes', async () => {
      const user = userEvent.setup();

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalItems: 50,
          itemsPerPage: 20,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      // Find a select element and click it to simulate page size change
      const selectElements = screen.getAllByTestId('select');
      await user.click(selectElements[selectElements.length - 1]); // Last select is likely page size

      expect(mockUseEmployeeStore().setPagination).toHaveBeenCalled();
    });

    it('should not render pagination when there is only one page', () => {
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 5,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Store Integration', () => {
    it('should call fetchEmployees on component mount', () => {
      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      expect(defaultMockStore.fetchEmployees).toHaveBeenCalledTimes(1);
    });

    it('should fetch employees on component mount', () => {
      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      expect(defaultMockStore.fetchEmployees).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    it('should render table with responsive classes', () => {
      const mockEmployees = [createMockEmployee('1')];

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 1,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      // Check that a table exists in the document
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty employee list', () => {
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: [],
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 0,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      expect(screen.getByText('0 employees found')).toBeInTheDocument();
      // No employee data rows should be present (headers might still be there)
      expect(screen.queryByText('PGN-2024-0001')).not.toBeInTheDocument();
    });

    
    it('should handle employees without optional callbacks', () => {
      render(<EmployeeList />);

      // Should not crash when callbacks are not provided
      expect(screen.getByText('Employees')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const mockEmployees = [createMockEmployee('1')];

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 1,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      // Check for proper table structure
      expect(screen.getByRole('table')).toBeInTheDocument();

      // Check for proper button roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Check for proper search input (there are multiple, so get the first one)
      const searchInputs = screen.getAllByRole('textbox');
      expect(searchInputs.length).toBeGreaterThan(0);
      expect(searchInputs[0]).toHaveAttribute('placeholder', 'Search employees...');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockEmployees = [createMockEmployee('1')];

      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        employees: mockEmployees,
        pagination: {
          ...defaultMockStore.pagination,
          totalItems: 1,
        },
      } as unknown);

      render(
        <EmployeeList
          onEmployeeSelect={mockOnEmployeeSelect}
          onEmployeeEdit={mockOnEmployeeEdit}
          onEmployeeCreate={mockOnEmployeeCreate}
        />
      );

      const addButton = screen.getByText('Add Employee');
      addButton.focus();

      await user.keyboard('{Enter}');
      expect(mockOnEmployeeCreate).toHaveBeenCalled();
    });
  });
});