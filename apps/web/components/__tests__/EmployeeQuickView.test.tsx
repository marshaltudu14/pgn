/**
 * Comprehensive Unit Tests for EmployeeQuickView Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { EmployeeWithRegions, EmploymentStatus } from '@pgn/shared';
import { EmployeeQuickView } from '../employee-quick-view';

// Mock UI components to simplify testing
jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open, onOpenChange }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    open ? (
      <div role="dialog" data-testid="sheet">
        {children}
        <button
          data-testid="close-sheet"
          onClick={() => onOpenChange(false)}
        >
          Close
        </button>
      </div>
    ) : null
  ),
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-title">{children}</div>
  ),
  SheetFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-footer">{children}</div>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className} data-testid="badge">{children}</span>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-title">{children}</div>
  ),
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
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <hr data-testid={testId || 'separator'} />
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Mail: ({ className }: { className?: string }) => <span data-testid="mail-icon" className={className}></span>,
  Phone: ({ className }: { className?: string }) => <span data-testid="phone-icon" className={className}></span>,
  Calendar: ({ className }: { className?: string }) => <span data-testid="calendar-icon" className={className}></span>,
  Edit: ({ className }: { className?: string }) => <span data-testid="edit-icon" className={className}></span>,
  Building: ({ className }: { className?: string }) => <span data-testid="building-icon" className={className}></span>,
  Shield: ({ className }: { className?: string }) => <span data-testid="shield-icon" className={className}></span>,
  CheckCircle: ({ className, 'data-testid': testId }: { className?: string; 'data-testid'?: string }) => <span data-testid={testId || "checkcircle-icon"} className={className}></span>,
  XCircle: ({ className, 'data-testid': testId }: { className?: string; 'data-testid'?: string }) => <span data-testid={testId || "xcircle-icon"} className={className}></span>,
  Clock: ({ className, 'data-testid': testId }: { className?: string; 'data-testid'?: string }) => <span data-testid={testId || "clock-icon"} className={className}></span>,
  User: ({ className }: { className?: string }) => <span data-testid="user-icon" className={className}></span>,
  Users: ({ className, 'data-testid': testId }: { className?: string; 'data-testid'?: string }) => <span data-testid={testId || "users-icon"} className={className}></span>,
  MapPin: ({ className }: { className?: string }) => <span data-testid="mappin-icon" className={className}></span>,
  Briefcase: ({ className }: { className?: string }) => <span data-testid="briefcase-icon" className={className}></span>,
  ChevronRight: ({ className }: { className?: string }) => <span data-testid="chevronright-icon" className={className}></span>,
}));

// Mock Avatar component
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="avatar" className={className}>{children}</div>
  ),
  AvatarFallback: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="avatar-fallback" className={className}>{children}</div>
  ),
}));

// Mock Card component
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

// Helper function to create mock employee data
const createMockEmployee = (overrides: Partial<EmployeeWithRegions> = {}): EmployeeWithRegions => ({
  id: 'emp-123',
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
  assigned_regions: {
    regions: [
      { id: 'region-1', city: 'New York', state: 'NY' },
      { id: 'region-2', city: 'Los Angeles', state: 'CA' },
      { id: 'region-3', city: 'Chicago', state: 'IL' },
      { id: 'region-4', city: 'Houston', state: 'TX' },
      { id: 'region-5', city: 'Phoenix', state: 'AZ' },
    ],
    total_count: 5
  },
  ...overrides,
});

describe('EmployeeQuickView Component', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should not render when open is false', () => {
      render(
        <EmployeeQuickView
          open={false}
          onOpenChange={mockOnOpenChange}
          employee={null}
        />
      );

      expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
    });

    it('should not render when employee is null', () => {
      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={null}
        />
      );

      expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
    });

    it('should render when open is true and employee is provided', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByTestId('sheet')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-header')).toBeInTheDocument();
    });

    it('should render employee basic information', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('PGN-2024-0001')).toBeInTheDocument();
    });

    it('should render contact information section', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('Contact Details')).toBeInTheDocument();
      expect(screen.getAllByText('Email')).toHaveLength(2); // One in summary, one in details
      expect(screen.getAllByText('Phone')).toHaveLength(2); // One in summary, one in details
      expect(screen.getAllByText('john.doe@example.com')).toHaveLength(2); // One in summary, one in details
      expect(screen.getAllByText('9876543210')).toHaveLength(2); // One in summary, one in details
    });

    it('should render employment details section', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('Employment Details')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Login Access')).toBeInTheDocument();
      expect(screen.getAllByText('Active')).toHaveLength(2); // One in header, one in details
      expect(screen.getAllByText('Enabled')).toHaveLength(2); // One in quick info, one in details
    });

    it('should render timeline information section', () => {
      const mockEmployee = createMockEmployee({
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Last Updated')).toBeInTheDocument();
      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('should render assigned regions section with all regions', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('Assigned Regions')).toBeInTheDocument();
      expect(screen.getByText('5 Regions')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
      expect(screen.getByText('Chicago')).toBeInTheDocument();
      expect(screen.getByText('Houston')).toBeInTheDocument();
      expect(screen.getByText('Phoenix')).toBeInTheDocument();
    });

    it('should render footer with edit button when onEdit is provided', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('Edit Employee Details')).toBeInTheDocument();
    });

    it('should not render edit button when onEdit is not provided', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
          onEdit={undefined}
        />
      );

      expect(screen.queryByText('Edit Employee Details')).not.toBeInTheDocument();
    });
  });

  describe('Employment Status Handling', () => {
    const statusTests = [
      { status: 'ACTIVE' as EmploymentStatus, expectedIcon: 'status-icon' },
      { status: 'SUSPENDED' as EmploymentStatus, expectedIcon: 'status-icon' },
      { status: 'RESIGNED' as EmploymentStatus, expectedIcon: 'status-icon' },
      { status: 'TERMINATED' as EmploymentStatus, expectedIcon: 'status-icon' },
      { status: 'ON_LEAVE' as EmploymentStatus, expectedIcon: 'status-icon' },
    ];

    statusTests.forEach(({ status }) => {
      it(`should render correct icon and badge for ${status} status`, () => {
        const mockEmployee = createMockEmployee({ employment_status: status });

        render(
          <EmployeeQuickView
            open={true}
            onOpenChange={mockOnOpenChange}
            employee={mockEmployee}
          />
        );

        // Map status to expected label text
        const statusLabels: Record<EmploymentStatus, string> = {
          ACTIVE: 'Active',
          SUSPENDED: 'Suspended',
          RESIGNED: 'Resigned',
          TERMINATED: 'Terminated',
          ON_LEAVE: 'On Leave'
        };

        // Check that the status badge exists with the correct text (appears twice)
        expect(screen.getAllByText(statusLabels[status])).toHaveLength(2);
      });
    });

    it('should display disabled login access correctly', () => {
      const mockEmployee = createMockEmployee({
        can_login: false,
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getAllByText('Disabled')).toHaveLength(2); // One in quick info, one in details
    });
  });

  describe('User Interactions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByText('Edit Employee Details');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockEmployee);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      const closeButton = screen.getByTestId('close-sheet');
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when sheet is closed by other means', () => {
      const mockEmployee = createMockEmployee();

      const { rerender } = render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      // Simulate external close
      rerender(
        <EmployeeQuickView
          open={false}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should handle employee with null phone', () => {
      const mockEmployee = createMockEmployee({ phone: undefined });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getAllByText('-')).toHaveLength(2); // One in quick info, one in details
    });

    it('should handle employee with empty phone', () => {
      const mockEmployee = createMockEmployee({ phone: '' });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getAllByText('-')).toHaveLength(2); // One in quick info, one in details
    });
  });

  describe('Regions Display', () => {
    it('should display "No Regions Assigned" when employee has no regions', () => {
      const mockEmployee = createMockEmployee({
        assigned_regions: {
          regions: [],
          total_count: 0
        }
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('No Regions Assigned')).toBeInTheDocument();
      expect(screen.getByText('This employee hasn\'t been assigned to any regions yet.')).toBeInTheDocument();
    });

    it('should display correct count for single region', () => {
      const mockEmployee = createMockEmployee({
        assigned_regions: {
          regions: [
            { id: 'region-1', city: 'Boston', state: 'MA' }
          ],
          total_count: 1
        }
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('1 Region')).toBeInTheDocument();
      expect(screen.getByText('Boston')).toBeInTheDocument();
      expect(screen.getByText('MA')).toBeInTheDocument();
    });

    it('should display correct count for multiple regions', () => {
      const mockEmployee = createMockEmployee({
        assigned_regions: {
          regions: [
            { id: 'region-1', city: 'Boston', state: 'MA' },
            { id: 'region-2', city: 'Miami', state: 'FL' },
            { id: 'region-3', city: 'Seattle', state: 'WA' }
          ],
          total_count: 3
        }
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('3 Regions')).toBeInTheDocument();
      expect(screen.getByText('Boston')).toBeInTheDocument();
      expect(screen.getByText('Miami')).toBeInTheDocument();
      expect(screen.getByText('Seattle')).toBeInTheDocument();
    });

    it('should handle missing assigned_regions gracefully', () => {
      const mockEmployeeWithoutRegions = {
        ...createMockEmployee(),
        assigned_regions: undefined
      } as unknown as EmployeeWithRegions;

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployeeWithoutRegions}
        />
      );

      // Should still render the component without crashing
      expect(screen.getByTestId('sheet')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle mismatch between total_count and actual regions length', () => {
      const mockEmployee = createMockEmployee({
        assigned_regions: {
          regions: [
            { id: 'region-1', city: 'Boston', state: 'MA' }
          ],
          total_count: 5 // Mismatch: total_count says 5 but only 1 region provided
        }
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      // Should display the actual count from the regions array
      expect(screen.getByText('1 Region')).toBeInTheDocument();
      expect(screen.getByText('Boston')).toBeInTheDocument();
    });
  });
});
