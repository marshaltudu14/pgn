/**
 * Comprehensive Unit Tests for SearchFieldSelector Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useEmployeeStore } from '@/app/lib/stores/employeeStore';
import SearchFieldSelector from '../search-field-selector';

// Mock the employee store
jest.mock('@/app/lib/stores/employeeStore');

// Mock UI components completely to avoid Radix UI issues
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="search-field-selector" data-value={value} data-disabled={disabled}>
      <div
        data-testid="search-field-trigger"
        onClick={() => onValueChange?.('first_name')}
        data-disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {children}
      </div>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="search-field-selector-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`search-field-option-${value}`}>{children}</div>
  ),
  SelectTrigger: ({ children, onClick, disabled, 'data-testid': testId, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    'data-testid'?: string;
    [key: string]: unknown;
  }) => (
    <button
      data-testid={testId || 'select-trigger'}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
}));

// Type for mocked store
type MockEmployeeStore = jest.MockedFunction<typeof useEmployeeStore>;

describe('SearchFieldSelector Component', () => {
  const mockUseEmployeeStore = useEmployeeStore as MockEmployeeStore;

  // Default mock store state
  const defaultMockStore = {
    filters: {
      search: '',
      searchField: 'human_readable_user_id' as const,
      status: 'all' as const,
      sortBy: 'created_at',
      sortOrder: 'desc' as const,
    },
    setFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEmployeeStore.mockReturnValue(defaultMockStore as unknown);
  });

  describe('Component Rendering', () => {
    it('should render the component with select elements', () => {
      render(<SearchFieldSelector />);

      expect(screen.getByTestId('search-field-selector')).toBeInTheDocument();
      expect(screen.getByTestId('search-field-trigger')).toBeInTheDocument();
    });

    it('should render with default value from store', () => {
      render(<SearchFieldSelector />);

      expect(screen.getByTestId('search-field-selector')).toHaveAttribute('data-value', 'human_readable_user_id');
    });

    it('should render with disabled state when disabled prop is true', () => {
      render(<SearchFieldSelector disabled />);

      expect(screen.getByTestId('search-field-selector')).toHaveAttribute('data-disabled', 'true');
      expect(screen.getByTestId('search-field-trigger')).toHaveAttribute('data-disabled', 'true');
    });
  });

  describe('Store Integration', () => {
    it('should use store value when no external value provided', () => {
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        filters: { ...defaultMockStore.filters, searchField: 'email' },
      } as unknown);

      render(<SearchFieldSelector />);

      expect(screen.getByTestId('search-field-selector')).toHaveAttribute('data-value', 'email');
    });

    it('should use external handler when provided', async () => {
      const mockOnValueChange = jest.fn();

      render(<SearchFieldSelector value="first_name" onValueChange={mockOnValueChange} />);

      expect(screen.getByTestId('search-field-selector')).toHaveAttribute('data-value', 'first_name');
    });

    it('should call setFilters when using store integration', async () => {

      render(<SearchFieldSelector />);

      const trigger = screen.getByTestId('search-field-trigger');
      trigger.click();

      expect(mockUseEmployeeStore().setFilters).toHaveBeenCalledWith({
        searchField: 'first_name'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing store gracefully', () => {
      mockUseEmployeeStore.mockReturnValue(undefined as unknown);

      render(<SearchFieldSelector value="first_name" onValueChange={jest.fn()} />);

      expect(screen.getByTestId('search-field-selector')).toBeInTheDocument();
    });

    it('should handle undefined store filters gracefully', () => {
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        filters: undefined,
      } as unknown);

      render(<SearchFieldSelector />);

      expect(screen.getByTestId('search-field-selector')).toBeInTheDocument();
    });

    it('should handle undefined searchField in store', () => {
      mockUseEmployeeStore.mockReturnValue({
        ...defaultMockStore,
        filters: { ...defaultMockStore.filters, searchField: undefined },
      } as unknown);

      render(<SearchFieldSelector />);

      expect(screen.getByTestId('search-field-selector')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should work with minimal props', () => {
      render(<SearchFieldSelector />);

      expect(screen.getByTestId('search-field-selector')).toBeInTheDocument();
    });

    it('should accept and use disabled prop', () => {
      render(<SearchFieldSelector disabled />);

      expect(screen.getByTestId('search-field-selector')).toHaveAttribute('data-disabled', 'true');
    });
  });
});