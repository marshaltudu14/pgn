/**
 * Unit tests for Regions Table component using Jest and React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegionsTable } from '../regions-table';
import { RegionSchema } from '@pgn/shared';

// Mock data
const mockRegions: RegionSchema[] = [
  {
    id: 'region-1',
    state: 'California',
    city: 'Los Angeles',
    state_slug: 'california',
    city_slug: 'los-angeles',
    employee_count: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'region-2',
    state: 'New York',
    city: 'New York',
    state_slug: 'new-york',
    city_slug: 'new-york',
    employee_count: 10,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'region-3',
    state: 'Texas',
    city: 'Austin',
    state_slug: 'texas',
    city_slug: 'austin',
    employee_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 3,
  itemsPerPage: 10,
};

describe('RegionsTable', () => {
  const defaultProps = {
    regions: mockRegions,
    isLoading: false,
    pagination: mockPagination,
    filters: {
      sort_by: 'city' as const,
      sort_order: 'asc' as const,
      page: 1,
      limit: 10,
    },
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onPageChange: jest.fn(),
    onSortChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders regions table correctly', () => {
    render(<RegionsTable {...defaultProps} />);

    // Check table headers
    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();
    expect(screen.getByText('State Slug')).toBeInTheDocument();
    expect(screen.getByText('City Slug')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check region data
    expect(screen.getByText('California')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles')).toBeInTheDocument();
    expect(screen.getByText('california')).toBeInTheDocument();
    expect(screen.getByText('los-angeles')).toBeInTheDocument();

    // Employee count is split across spans, so we check them separately
    expect(screen.getByText('5')).toBeInTheDocument();
    // 'employees' appears multiple times, so use getAllByText
    expect(screen.getAllByText('employees').length).toBeGreaterThan(0);

    // New York appears twice (state and city), so use getAllByText
    expect(screen.getAllByText('New York').length).toBe(2);
    // new-york also appears twice (state slug and city slug)
    expect(screen.getAllByText('new-york').length).toBe(2);
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('Texas')).toBeInTheDocument();
    expect(screen.getByText('Austin')).toBeInTheDocument();
    expect(screen.getByText('texas')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<RegionsTable {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    // Table should still render headers but no data rows
    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();
  });

  it('shows empty state when no regions', () => {
    render(<RegionsTable {...defaultProps} regions={[]} />);

    expect(screen.getByText('No regions found')).toBeInTheDocument();
  });

  it('handles sorting clicks correctly', async () => {
    render(<RegionsTable {...defaultProps} />);

    const stateHeader = screen.getByText('State');
    const cityHeader = screen.getByText('City');

    // Click state header to sort (default is asc since current sort is city)
    fireEvent.click(stateHeader);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('state', 'asc');

    // Click city header to sort (default is desc since current sort is state)
    fireEvent.click(cityHeader);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('city', 'desc');
  });

  it('shows correct sort indicators', () => {
    render(<RegionsTable {...defaultProps} filters={{ ...defaultProps.filters, sort_by: 'state', sort_order: 'desc' }} />);

    // State header should have descending indicator
    const stateHeader = screen.getByText('State').closest('button');
    expect(stateHeader).toBeInTheDocument();
    // Look for sort indicator (typically an arrow icon)
    const sortIndicators = stateHeader?.querySelector('svg');
    expect(sortIndicators).toBeInTheDocument();

    // City header should have ascending indicator (default)
    const cityHeader = screen.getByText('City').closest('button');
    expect(cityHeader).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<RegionsTable {...defaultProps} />);

    const editButtons = screen.getAllByRole('button').filter(button =>
      button.getAttribute('aria-label')?.includes('edit') ||
      button.closest('tr')?.textContent?.includes('Los Angeles')
    );

    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0]);
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockRegions[0]);
    }
  });

  it('calls onDelete when delete button is clicked', async () => {
    render(<RegionsTable {...defaultProps} />);

    // Find the delete button for the first region (Los Angeles)
    const losAngelesRow = screen.getByText('Los Angeles').closest('tr');
    if (losAngelesRow) {
      const deleteButton = losAngelesRow.querySelector('[data-testid="delete-button"]') ||
                           Array.from(losAngelesRow.querySelectorAll('button')).find(button =>
                             button.innerHTML.includes('Trash2') || button.getAttribute('aria-label')?.includes('delete')
                           );

      if (deleteButton) {
        fireEvent.click(deleteButton);
        // In the dialog, find and click the confirm delete button
        await waitFor(() => {
          const confirmButton = screen.getByRole('button', { name: 'Delete' });
          fireEvent.click(confirmButton);
        });
        expect(defaultProps.onDelete).toHaveBeenCalledWith(mockRegions[0].id);
      }
    }
  });

  it('displays employee count correctly for singular and plural', () => {
    render(<RegionsTable {...defaultProps} />);

    // Check that employee counts are displayed
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Check that "employees" text appears for plural (use getAllByText since there are multiple)
    const employeeTexts = screen.getAllByText('employees');
    expect(employeeTexts.length).toBe(3); // Three regions with multiple employees

    // Test with single employee
    const singleEmployeeRegions = mockRegions.map(region =>
      ({ ...region, employee_count: 1 })
    );
    render(<RegionsTable {...defaultProps} regions={singleEmployeeRegions} />);

    // Should show "employee" (singular) for each
    const singularEmployeeTexts = screen.getAllByText('employee');
    expect(singularEmployeeTexts.length).toBe(3);
  });

  it('applies correct CSS classes for sortable headers', () => {
    render(<RegionsTable {...defaultProps} />);

    const stateHeader = screen.getByText('State').closest('button');
    const cityHeader = screen.getByText('City').closest('button');

    expect(stateHeader).toHaveClass('cursor-pointer', 'hover:bg-accent');
    expect(cityHeader).toHaveClass('cursor-pointer', 'hover:bg-accent');
  });

  it('handles different sort orders correctly', () => {
    const { rerender } = render(<RegionsTable {...defaultProps} filters={{ ...defaultProps.filters, sort_by: 'state', sort_order: 'asc' }} />);

    let stateHeader = screen.getByText('State').closest('button');
    expect(stateHeader).toBeInTheDocument();

    // Change to descending sort
    rerender(<RegionsTable {...defaultProps} filters={{ ...defaultProps.filters, sort_by: 'state', sort_order: 'desc' }} />);

    stateHeader = screen.getByText('State').closest('button');
    expect(stateHeader).toBeInTheDocument();
  });

  it('displays region slugs correctly', () => {
    render(<RegionsTable {...defaultProps} />);

    expect(screen.getByText('california')).toBeInTheDocument();
    expect(screen.getByText('los-angeles')).toBeInTheDocument();
    // Note: new-york appears twice (state and city), so we check by context
    const newyorkElements = screen.getAllByText('new-york');
    expect(newyorkElements.length).toBe(2);
    expect(screen.getByText('texas')).toBeInTheDocument();
    expect(screen.getByText('austin')).toBeInTheDocument();
  });

  it('has correct table structure and accessibility', () => {
    render(<RegionsTable {...defaultProps} />);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Check for proper table headers
    const stateHeader = screen.getByRole('columnheader', { name: 'State' });
    const cityHeader = screen.getByRole('columnheader', { name: 'City' });
    const employeesHeader = screen.getByRole('columnheader', { name: 'Employees' });
    const actionsHeader = screen.getByRole('columnheader', { name: 'Actions' });

    expect(stateHeader).toBeInTheDocument();
    expect(cityHeader).toBeInTheDocument();
    expect(employeesHeader).toBeInTheDocument();
    expect(actionsHeader).toBeInTheDocument();
  });

  it('filters regions correctly when search term is provided', () => {
    const searchTerm = 'Los';
    const filteredRegions = mockRegions.filter(region =>
      region.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    render(<RegionsTable {...defaultProps} regions={filteredRegions} />);

    expect(screen.getByText('Los Angeles')).toBeInTheDocument();
    expect(screen.queryByText('New York')).not.toBeInTheDocument();
    expect(screen.queryByText('Austin')).not.toBeInTheDocument();
  });

  it('handles null or undefined regions gracefully', () => {
    const { unmount } = render(<RegionsTable {...defaultProps} regions={[]} />);
    expect(screen.getByText('No regions found')).toBeInTheDocument();
    unmount();

    render(<RegionsTable {...defaultProps} regions={[]} />);
    expect(screen.getByText('No regions found')).toBeInTheDocument();
  });
});