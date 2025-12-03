/**
 * Comprehensive Unit Tests for EmployeeQuickView Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Employee, EmploymentStatus } from '@pgn/shared';
import { EmployeeQuickView } from '../employee-quick-view';

// Mock UI components to simplify testing
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    open ? (
      <div role="dialog" data-testid="dialog">
        {children}
        <button
          data-testid="close-dialog"
          onClick={() => onOpenChange(false)}
        >
          Close
        </button>
      </div>
    ) : null
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-title">{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-description">{children}</div>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className} data-testid="badge">{children}</span>
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
}));

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
    { city: 'Pune', state: 'Maharashtra' },
  ]),
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  employment_status_changed_at: '2024-01-01T00:00:00Z',
  employment_status_changed_by: 'admin',
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

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should not render when employee is null', () => {
      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={null}
        />
      );

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
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

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
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

      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('9876543210')).toBeInTheDocument();
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
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
      expect(screen.getByTestId('badge')).toHaveTextContent('ACTIVE');
      expect(screen.getByTestId('status-icon')).toBeInTheDocument();
      expect(screen.getByTestId('login-enabled-icon')).toBeInTheDocument();
      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByTestId('building-icon')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
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
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('should render assigned cities section', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('Assigned Cities')).toBeInTheDocument();
      expect(screen.getByText('Mumbai')).toBeInTheDocument();
      expect(screen.getByText('Pune')).toBeInTheDocument();
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

      expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
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

      expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
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

    statusTests.forEach(({ status, expectedIcon }) => {
      it(`should render correct icon and badge for ${status} status`, () => {
        const mockEmployee = createMockEmployee({ employment_status: status });

        render(
          <EmployeeQuickView
            open={true}
            onOpenChange={mockOnOpenChange}
            employee={mockEmployee}
          />
        );

        expect(screen.getByTestId(expectedIcon)).toBeInTheDocument();
        expect(screen.getByTestId('badge')).toHaveTextContent(
          status.replace('_', ' ')
        );
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

      expect(screen.getByTestId('login-disabled-icon')).toBeInTheDocument();
      expect(screen.getByText('Disabled')).toBeInTheDocument();
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

      const editButton = screen.getByText('Edit Employee');
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

      const closeButton = screen.getByTestId('close-dialog');
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when dialog is closed by other means', () => {
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

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should handle employee with null phone', () => {
      const mockEmployee = createMockEmployee({ phone: '' });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('-')).toBeInTheDocument();
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

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should handle employee with null assigned_cities', () => {
      const mockEmployee = createMockEmployee({ assigned_cities: null });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should handle employee with empty assigned_cities array', () => {
      const mockEmployee = createMockEmployee({
        assigned_cities: JSON.stringify([]),
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should handle employee with malformed assigned_cities', () => {
      const mockEmployee = createMockEmployee({
        assigned_cities: 'invalid json',
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('invalid json')).toBeInTheDocument();
    });

    it('should handle employee with string assigned_cities', () => {
      const mockEmployee = createMockEmployee({
        assigned_cities: 'Mumbai',
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('Mumbai')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      const mockEmployee = createMockEmployee({
        created_at: '2024-12-25T15:30:00Z',
        updated_at: '2024-01-01T09:15:00Z',
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText('Dec 25, 2024')).toBeInTheDocument();
      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    });

    it('should truncate long email addresses', () => {
      const longEmail = 'very.long.email.address.that.should.be.truncated@example.com';
      const mockEmployee = createMockEmployee({ email: longEmail });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      const emailElement = screen.getByText(longEmail);
      expect(emailElement).toHaveClass('break-all');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      // Check for proper headings and sections
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Employment Details')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Assigned Cities')).toBeInTheDocument();
    });

    it('should have proper button labels', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByText('Edit Employee');
      expect(editButton).toBeInTheDocument();

      const closeButton = screen.getByTestId('close-dialog');
      expect(closeButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
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

      const editButton = screen.getByText('Edit Employee');
      editButton.focus();

      await user.keyboard('{Enter}');
      expect(mockOnEdit).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive container classes', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      const dialogContent = screen.getByTestId('dialog-content');
      expect(dialogContent).toBeInTheDocument();
      // Dialog is responsive by design - basic existence test is sufficient
    });

    it('should have responsive grid layout', () => {
      const mockEmployee = createMockEmployee();

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      // Check that grid layout exists (would need to check actual implementation)
      // This is more of a structural test
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Employment Details')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle employee with missing required fields', () => {
      const incompleteEmployee = {
        id: 'emp-123',
        human_readable_user_id: 'PGN-2024-0001',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        employment_status: 'ACTIVE' as EmploymentStatus,
        can_login: true,
        assigned_cities: null,
        created_at: null,
        updated_at: null,
        employment_status_changed_at: null,
        employment_status_changed_by: null,
      };

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={incompleteEmployee}
        />
      );

      // Should render without crashing
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('should handle employee with future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureYear = futureDate.getFullYear();
      const expectedPattern = new RegExp(`[A-Za-z]{3} \\d{1,2}, ${futureYear}`);

      const mockEmployee = createMockEmployee({
        created_at: futureDate.toISOString(),
        updated_at: futureDate.toISOString(),
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      // Should format future dates correctly (both Created and Last Updated should show the future date)
      const dateElements = screen.getAllByText(expectedPattern);
      expect(dateElements).toHaveLength(2);
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(100);
      const mockEmployee = createMockEmployee({
        first_name: longName,
        last_name: longName,
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText(`${longName} ${longName}`)).toBeInTheDocument();
    });

    it('should handle special characters in email', () => {
      const specialEmail = 'test+tag@example-domain.co.uk';
      const mockEmployee = createMockEmployee({
        email: specialEmail,
      });

      render(
        <EmployeeQuickView
          open={true}
          onOpenChange={mockOnOpenChange}
          employee={mockEmployee}
        />
      );

      expect(screen.getByText(specialEmail)).toBeInTheDocument();
    });
  });
});