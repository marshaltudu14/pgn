/**
 * Integration Tests for RegionalAssignmentForm
 * Focuses on business logic and user behavior
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RegionalAssignmentForm } from '../RegionalAssignmentForm';
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { EmployeeFormData } from '@pgn/shared';

// Mock the regions store
const mockRegions = [
  {
    id: 'region-1',
    city: 'New York',
    state: 'NY',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'region-2',
    city: 'Los Angeles',
    state: 'CA',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'region-3',
    city: 'Chicago',
    state: 'IL',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Mock the regions store
jest.mock('@/app/lib/stores/regionsStore', () => ({
  useRegionsStore: jest.fn(),
}));

const mockUseRegionsStore = useRegionsStore as jest.MockedFunction<typeof useRegionsStore>;

// Mock form with essential methods
const createMockForm = (defaultValues: Partial<EmployeeFormData> = { assigned_regions: [] }) => ({
  watch: jest.fn((field: string) => defaultValues[field as keyof EmployeeFormData]),
  getValues: jest.fn(() => defaultValues),
  setValue: jest.fn((field: string, value: any) => {
    (defaultValues as any)[field as keyof EmployeeFormData] = value;
  }),
  control: {
    _subjects: {
      state: { observers: [], next: jest.fn() },
      values: { observers: [], next: jest.fn() }
    }
  } as any,
  formState: {
    errors: {},
    isValid: true,
    isDirty: false,
    isLoading: false,
    isSubmitted: false,
    isSubmitSuccessful: false,
    isSubmitting: false,
    submitCount: 0,
    dirtyFields: {},
    touchedFields: {},
    validatingFields: {},
  } as any,
  trigger: jest.fn(),
  register: jest.fn(),
  unregister: jest.fn(),
  handleSubmit: jest.fn(),
  reset: jest.fn(),
  resetField: jest.fn(),
  setError: jest.fn(),
  clearErrors: jest.fn(),
  getFieldState: jest.fn(() => ({
    invalid: false,
    isDirty: false,
    isTouched: false,
    error: undefined,
    isValidating: false
  })) as any,
  setFocus: jest.fn(),
}) as any;

describe('RegionalAssignmentForm - Business Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRegionsStore.mockReturnValue({
      regions: mockRegions,
      isLoading: false,
      fetchRegions: jest.fn(),
      searchRegions: jest.fn(),
    } as any);
  });

  describe('Core Functionality', () => {
    test('loads and displays available regions', () => {
      const form = createMockForm();
      render(<RegionalAssignmentForm form={form} />);

      expect(screen.getByRole('heading', { name: 'Regional Assignment' })).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('allows selecting regions from dropdown', async () => {
      const form = createMockForm();
      render(<RegionalAssignmentForm form={form} />);

      // Open dropdown
      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      // Should show available regions
      await waitFor(() => {
        expect(screen.getByText('New York, NY')).toBeInTheDocument();
        expect(screen.getByText('Los Angeles, CA')).toBeInTheDocument();
      });
    });

    test('updates form when region is selected', async () => {
      const form = createMockForm();
      render(<RegionalAssignmentForm form={form} />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      // Select New York
      const newYorkOption = screen.getByText('New York, NY');
      fireEvent.click(newYorkOption);

      // Form should be updated
      expect(form.setValue).toHaveBeenCalledWith('assigned_regions', ['region-1'], {
        shouldDirty: true,
        shouldValidate: true,
      });
    });

    test('removes region from form when deselected', async () => {
      const form = createMockForm({ assigned_regions: ['region-1', 'region-2'] });
      form.watch.mockReturnValue(['region-1', 'region-2']);

      render(<RegionalAssignmentForm form={form} />);

      // Should show selected regions
      expect(screen.getByText('Selected Cities (2)')).toBeInTheDocument();

      // Click remove button for first region
      const removeButton = screen.getByLabelText(/Remove/);
      fireEvent.click(removeButton);

      // Form should be updated with removed region
      expect(form.setValue).toHaveBeenCalled();
    });
  });

  describe('Search Behavior', () => {
    test('fetches regions with search query', async () => {
      const mockFetchRegions = jest.fn();
      mockUseRegionsStore.mockReturnValue({
        regions: [],
        isLoading: false,
        fetchRegions: mockFetchRegions,
      } as any);

      const form = createMockForm();
      render(<RegionalAssignmentForm form={form} />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      const searchInput = screen.getByPlaceholderText(/Search cities or states/i);
      fireEvent.change(searchInput, { target: { value: 'New York' } });

      // Wait for debounce
      await waitFor(() => {
        expect(mockFetchRegions).toHaveBeenCalledWith({
          limit: 100,
          page: 1,
          search: 'New York',
        });
      }, { timeout: 500 });
    });

    test('clears search when input is empty', async () => {
      const mockFetchRegions = jest.fn();
      mockUseRegionsStore.mockReturnValue({
        regions: [],
        isLoading: false,
        fetchRegions: mockFetchRegions,
      } as any);

      const form = createMockForm();
      render(<RegionalAssignmentForm form={form} />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      const searchInput = screen.getByPlaceholderText(/Search cities or states/i);

      // Type and clear
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      // Should fetch all regions
      await waitFor(() => {
        expect(mockFetchRegions).toHaveBeenCalledWith({
          limit: 100,
          page: 1,
          search: '',
        });
      }, { timeout: 500 });
    });
  });

  describe('Persistence During Search', () => {
    test('keeps selected regions visible when searching', async () => {
      // Simulate having selected regions
      const form = createMockForm({ assigned_regions: ['region-1'] });
      form.watch.mockReturnValue(['region-1']);

      // Mock search results without the selected region
      mockUseRegionsStore.mockReturnValue({
        regions: [mockRegions[1]], // Only LA, not NY
        isLoading: false,
        fetchRegions: jest.fn(),
      } as any);

      render(<RegionalAssignmentForm form={form} />);

      // Should still show selected region even if not in current search results
      expect(screen.getByText('Selected Cities (1)')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
    });

    test('can remove selected region even after search', async () => {
      const form = createMockForm({ assigned_regions: ['region-1'] });
      form.watch.mockReturnValue(['region-1']);

      mockUseRegionsStore.mockReturnValue({
        regions: [], // Empty search results
        isLoading: false,
        fetchRegions: jest.fn(),
      } as any);

      render(<RegionalAssignmentForm form={form} />);

      // Should still show remove button
      const removeButton = screen.getByLabelText(/Remove/);
      expect(removeButton).toBeInTheDocument();

      fireEvent.click(removeButton);
      expect(form.setValue).toHaveBeenCalled();
    });
  });

  describe('Form Integration', () => {
    test('has combobox enabled by default', () => {
      const form = createMockForm();
      render(<RegionalAssignmentForm form={form} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).not.toBeDisabled();
    });

    test('shows correct count for multiple selections', async () => {
      const form = createMockForm({ assigned_regions: ['region-1', 'region-2', 'region-3'] });
      form.watch.mockReturnValue(['region-1', 'region-2', 'region-3']);

      render(<RegionalAssignmentForm form={form} />);

      expect(screen.getByText('3 cities selected')).toBeInTheDocument();
      expect(screen.getByText('Selected Cities (3)')).toBeInTheDocument();
    });

    test('displays placeholder when no regions selected', () => {
      const form = createMockForm();
      form.watch.mockReturnValue([]);

      render(<RegionalAssignmentForm form={form} />);

      expect(screen.getByText('Select cities...')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    test('shows loading state', () => {
      mockUseRegionsStore.mockReturnValue({
        regions: [],
        isLoading: true,
        fetchRegions: jest.fn(),
      } as any);

      const form = createMockForm();
      render(<RegionalAssignmentForm form={form} />);

      expect(screen.getByText('Loading cities...')).toBeInTheDocument();
    });

    test('shows empty state when no regions', () => {
      mockUseRegionsStore.mockReturnValue({
        regions: [],
        isLoading: false,
        fetchRegions: jest.fn(),
      } as any);

      const form = createMockForm();
      render(<RegionalAssignmentForm form={form} />);

      expect(screen.getByText('No cities available')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper labels and ARIA attributes', () => {
      const form = createMockForm();
      render(<RegionalAssignmentForm form={form} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('type', 'button');
    });

    test('remove buttons have accessible labels', () => {
      const form = createMockForm({ assigned_regions: ['region-1'] });
      form.watch.mockReturnValue(['region-1']);

      render(<RegionalAssignmentForm form={form} />);

      // The remove button should have a label containing the city and state
      const removeButton = screen.getByLabelText(/Remove\s+New York,\s+NY/);
      expect(removeButton).toBeInTheDocument();
    });
  });
});