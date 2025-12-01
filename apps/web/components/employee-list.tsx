/**
 * Employee List Component
 * Displays a searchable, filterable, and paginated list of employees
 * Responsive design: table for desktop/tablet, mobile list for mobile
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useDebounce } from '@/lib/utils/debounce';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Employee, EmploymentStatus, CityAssignment, EmployeeListParams } from '@pgn/shared';

type SearchFieldType = EmployeeListParams['search_field'];
import { useEmployeeStore } from '@/app/lib/stores/employeeStore';
import SearchFieldSelector from '@/components/search-field-selector';
import { Search, Filter, Plus, Edit, Eye, X } from 'lucide-react';

interface EmployeeListProps {
  onEmployeeSelect?: (employee: Employee) => void;
  onEmployeeEdit?: (employee: Employee) => void;
  onEmployeeCreate?: () => void;
}

const EMPLOYMENT_STATUS_COLORS: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
  SUSPENDED: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
  RESIGNED: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  TERMINATED: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
  ON_LEAVE: 'bg-muted text-muted-foreground',
};

const EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE'];

export function EmployeeList({
  onEmployeeSelect,
  onEmployeeEdit,
  onEmployeeCreate,
}: EmployeeListProps) {
  const {
    employees,
    loading,
    error,
    pagination,
    filters,
    fetchEmployees,
    setFilters,
    setPagination,
    clearError,
  } = useEmployeeStore();

  // Initial data fetch when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Local state for search input (immediate updates)
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearchInput = useDebounce(searchInput, 300);

  // Handle search changes when debounced value updates
  useEffect(() => {
    if (filters.search !== debouncedSearchInput) {
      setFilters({ search: debouncedSearchInput });
      setPagination(1); // Reset to first page
      fetchEmployees();
    }
  }, [debouncedSearchInput, filters.search, setFilters, setPagination, fetchEmployees]);

  // Handle search input changes (immediate)
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    // If clearing the search, apply immediately for better UX
    if (value === '' && filters.search !== '') {
      setFilters({ search: '' });
      setPagination(1);
      fetchEmployees();
    }
  }, [setFilters, setPagination, fetchEmployees, filters.search]);

  const handleStatusChange = useCallback((value: EmploymentStatus | 'all') => {
    setFilters({ status: value });
    setPagination(1); // Reset to first page
    fetchEmployees(); // Non-search filter triggers immediate fetch
  }, [setFilters, setPagination, fetchEmployees]);

  const handleSearchFieldChange = useCallback((value: SearchFieldType) => {
    setFilters({ searchField: value });
    setPagination(1); // Reset to first page
    fetchEmployees(); // Non-search filter triggers immediate fetch
  }, [setFilters, setPagination, fetchEmployees]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setFilters({ search: '' });
    setPagination(1);
    fetchEmployees();
  }, [setFilters, setPagination, fetchEmployees]);

  
  const handlePageChange = (page: number) => {
    setPagination(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPagination(1, size); // Reset to first page with new page size
  };

  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-muted-foreground">
            {pagination.totalItems} employee{pagination.totalItems !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={onEmployeeCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex justify-between items-center">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Button variant="outline" size="sm" onClick={clearError} className="cursor-pointer">
            Dismiss
          </Button>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="px-2 py-3 lg:p-6 border-b border-border bg-white dark:bg-black">
        {/* Desktop Layout - selects on sides, search in center */}
        <div className="hidden sm:flex items-center gap-4">
          {/* Left: Search Field Selector */}
          <SearchFieldSelector onValueChange={handleSearchFieldChange} />

          {/* Center: Search Input - takes full available width */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10 w-full"
              aria-label="Search employees"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right: Status Filter */}
          <Select value={filters.status} onValueChange={(value) => handleStatusChange(value as EmploymentStatus | 'all')}>
            <SelectTrigger className="w-48 cursor-pointer">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {EMPLOYMENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Layout - selects on top, search below */}
        <div className="sm:hidden space-y-4">
          <div className="flex gap-4">
            <SearchFieldSelector onValueChange={handleSearchFieldChange} />
            <Select value={filters.status} onValueChange={(value) => handleStatusChange(value as EmploymentStatus | 'all')}>
              <SelectTrigger className="flex-1 cursor-pointer">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {EMPLOYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10 w-full"
              aria-label="Search employees"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table View - Desktop and Mobile */}
      <div className="bg-white dark:bg-black">
        <div className="px-2 py-3 lg:p-6">
          <div className="w-full overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Primary Region</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && employees.length === 0 ? (
                  // Show skeleton rows when loading and no data exists
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 rounded" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-8 w-40" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded cursor-pointer" />
                          <Skeleton className="h-8 w-8 rounded cursor-pointer" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {employees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {employee.human_readable_user_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </div>
                        {employee.email && (
                          <div className="text-sm text-muted-foreground md:hidden">
                            {employee.email.length > 20 ? `${employee.email.slice(0, 20)}...` : employee.email}
                          </div>
                        )}
                        {employee.phone && (
                          <div className="text-sm text-muted-foreground lg:hidden">
                            {employee.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{employee.email}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">{employee.phone || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={EMPLOYMENT_STATUS_COLORS[employee.employment_status as EmploymentStatus]}>
                        {employee.employment_status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-sm">
                        {(employee.assigned_cities as unknown as CityAssignment[])?.map((city: CityAssignment) => city.city).join(', ') || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEmployeeSelect?.(employee)}
                          className="cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEmployeeEdit?.(employee)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                    ))}
                    {!loading && employees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <p className="text-lg font-medium">No employees found</p>
                            <p className="text-sm">Try adjusting your search or filter criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination - visible on all screen sizes */}
      {pagination.totalPages > 1 && (
        <div className="px-2 py-3 lg:p-6 border-t border-border bg-white dark:bg-black">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-2">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
              </div>
              <Select
                value={pagination.itemsPerPage.toString()}
                onValueChange={(value) => handlePageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-20 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="cursor-pointer hover:bg-accent transition-colors"
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="cursor-pointer hover:bg-accent transition-colors"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}