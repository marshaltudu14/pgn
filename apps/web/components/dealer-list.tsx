/**
 * Dealer List Component
 * Displays a searchable, filterable, and paginated list of dealers
 * Responsive design: table for desktop/tablet, mobile list for mobile
 */

'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { DealerWithRetailers } from '@pgn/shared';
import { useDealerStore } from '@/app/lib/stores/dealerStore';
import { Search, Plus, Edit, Eye, Building, Mail, Phone, X, ChevronUp, ChevronDown } from 'lucide-react';

interface DealerListProps {
  onDealerSelect?: (dealer: DealerWithRetailers) => void;
  onDealerEdit?: (dealer: DealerWithRetailers) => void;
  onDealerCreate?: () => void;
}

export function DealerList({
  onDealerSelect,
  onDealerEdit,
  onDealerCreate,
}: DealerListProps) {
  const {
    dealers,
    loading,
    error,
    pagination,
    filters,
    fetchDealers,
    setFilters,
    setPagination,
    clearError,
  } = useDealerStore();

  // Local state for search input (immediate updates)
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearchInput = useDebounce(searchInput, 300);

  // Use a ref to store the store functions to prevent re-renders
  const storeFunctions = useRef({
    fetchDealers,
    setFilters,
    setPagination,
  });

  // Update ref when store functions change
  useEffect(() => {
    storeFunctions.current = {
      fetchDealers,
      setFilters,
      setPagination,
    };
  }, [fetchDealers, setFilters, setPagination]);

  // Initial data fetch when component mounts
  useEffect(() => {
    storeFunctions.current.fetchDealers();
  }, []); // Empty dependency array - only run once on mount

  // Handle search changes when debounced value updates
  useEffect(() => {
    if (filters.search !== debouncedSearchInput) {
      storeFunctions.current.setFilters({ search: debouncedSearchInput });
      storeFunctions.current.setPagination(1); // Reset to first page
      storeFunctions.current.fetchDealers();
    }
  }, [debouncedSearchInput, filters.search]);

  
  // Handle search input changes (immediate)
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    // If clearing the search, apply immediately for better UX
    if (value === '' && filters.search !== '') {
      storeFunctions.current.setFilters({ search: '' });
      storeFunctions.current.setPagination(1);
      storeFunctions.current.fetchDealers();
    }
  }, [filters.search]);

  
  const handlePageChange = useCallback((page: number) => {
    storeFunctions.current.setPagination(page);
    storeFunctions.current.fetchDealers();
  }, []);

  const handleSort = useCallback((sortBy: 'name' | 'created_at' | 'updated_at') => {
    const newSortOrder = filters.sort_by === sortBy && filters.sort_order === 'asc' ? 'desc' : 'asc';
    storeFunctions.current.setFilters({ sort_by: sortBy, sort_order: newSortOrder });
    storeFunctions.current.fetchDealers();
  }, [filters.sort_by, filters.sort_order]);

  // Generate pagination items
  const generatePaginationItems = () => {
    const { currentPage, totalPages } = pagination;
    const items = [];

    // Always show first page
    if (currentPage > 3) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Show pages around current page
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={i === currentPage}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  
  if (loading && dealers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dealers</h2>
          <Button onClick={onDealerCreate} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Add Dealer
          </Button>
        </div>
        <div className="px-2 py-3 lg:p-6 border-b border-border bg-white dark:bg-black">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
        <div className="bg-white dark:bg-black">
          <div className="px-2 py-3 lg:p-6">
            <div className="w-full overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center">
                        Name
                        {filters.sort_by === 'name' ? (
                          filters.sort_order === 'asc' ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          )
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="hidden xl:table-cell">Address</TableHead>
                    <TableHead className="hidden lg:table-cell cursor-pointer" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center">
                        Created By
                        {filters.sort_by === 'created_at' ? (
                          filters.sort_order === 'asc' ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          )
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell cursor-pointer" onClick={() => handleSort('updated_at')}>
                      <div className="flex items-center">
                        Updated By
                        {filters.sort_by === 'updated_at' ? (
                          filters.sort_order === 'asc' ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          )
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded cursor-pointer" />
                          <Skeleton className="h-8 w-8 rounded cursor-pointer" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dealers</h2>
          <p className="text-muted-foreground">
            {pagination.totalItems} dealer{pagination.totalItems !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={onDealerCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Dealer
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search dealers by name..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  storeFunctions.current.setFilters({ search: '' });
                  storeFunctions.current.setPagination(1);
                  storeFunctions.current.fetchDealers();
                }}
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
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleSort('name')}
                    >
                      Name
                      {filters.sort_by === 'name' && (
                        filters.sort_order === 'asc' ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      Name
                      {filters.sort_by === 'name' ? (
                        filters.sort_order === 'asc' ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Address</TableHead>
                  <TableHead className="hidden lg:table-cell cursor-pointer" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">
                      Created By
                      {filters.sort_by === 'created_at' ? (
                        filters.sort_order === 'asc' ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell cursor-pointer" onClick={() => handleSort('updated_at')}>
                    <div className="flex items-center">
                      Updated By
                      {filters.sort_by === 'updated_at' ? (
                        filters.sort_order === 'asc' ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealers.map((dealer) => (
                  <TableRow key={dealer.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{dealer.name}</div>
                        {dealer.email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 md:hidden">
                            <Mail className="h-3 w-3" />
                            {dealer.email.length > 15 ? `${dealer.email.slice(0, 15)}...` : dealer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {dealer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {dealer.phone}
                          </div>
                        )}
                        {dealer.email && !dealer.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 md:hidden">
                            <Mail className="h-3 w-3" />
                            {dealer.email.length > 15 ? `${dealer.email.slice(0, 15)}...` : dealer.email}
                          </div>
                        )}
                        {!dealer.phone && !dealer.email && '-'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-sm max-w-xs truncate">
                        {dealer.address || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        {dealer.created_by_employee ? (
                          <div>
                            <div className="font-medium">{dealer.created_by_employee.first_name} {dealer.created_by_employee.last_name}</div>
                            <div className="text-muted-foreground">{dealer.created_by_employee.human_readable_user_id}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Admin</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        {dealer.updated_by_employee ? (
                          <div>
                            <div className="font-medium">{dealer.updated_by_employee.first_name} {dealer.updated_by_employee.last_name}</div>
                            <div className="text-muted-foreground">{dealer.updated_by_employee.human_readable_user_id}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Admin</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDealerSelect?.(dealer)}
                          className="cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDealerEdit?.(dealer)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center p-4 lg:p-6 border-t border-border bg-white dark:bg-black">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {generatePaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  className={pagination.currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Empty State */}
      {!loading && dealers.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No dealers found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by adding your first dealer.
          </p>
          <Button onClick={onDealerCreate} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Add Dealer
          </Button>
        </div>
      )}
    </div>
  );
}