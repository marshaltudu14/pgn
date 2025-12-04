/**
 * Farmer List Component
 * Displays a searchable, filterable, and paginated list of farmers
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { FarmerWithRetailer } from '@pgn/shared';
import { useFarmerStore } from '@/app/lib/stores/farmerStore';
import { Search, Plus, Edit, Eye, Mail, Phone, User, X } from 'lucide-react';

interface FarmerListProps {
  onFarmerSelect?: (farmer: FarmerWithRetailer) => void;
  onFarmerEdit?: (farmer: FarmerWithRetailer) => void;
  onFarmerCreate?: () => void;
}

export function FarmerList({
  onFarmerSelect,
  onFarmerEdit,
  onFarmerCreate,
}: FarmerListProps) {
  const {
    farmers,
    loading,
    error,
    pagination,
    filters,
    fetchFarmers,
    fetchRetailers,
    setFilters,
    setPagination,
    clearError,
  } = useFarmerStore();

  // Use a ref to store the store functions to prevent re-renders
  const storeFunctions = useRef({
    fetchRetailers,
    fetchFarmers,
    setFilters,
    setPagination,
  });

  // Update ref when store functions change
  useEffect(() => {
    storeFunctions.current = {
      fetchRetailers,
      fetchFarmers,
      setFilters,
      setPagination,
    };
  }, [fetchRetailers, fetchFarmers, setFilters, setPagination]);

  useEffect(() => {
    storeFunctions.current.fetchRetailers();
  }, []); // Empty dependency array - only run once on mount

  // Initial data fetch when component mounts
  useEffect(() => {
    storeFunctions.current.fetchFarmers();
  }, []); // Empty dependency array - only run once on mount

  // Local state for search input (immediate updates)
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearchInput = useDebounce(searchInput, 300);

  // Handle search changes when debounced value updates
  useEffect(() => {
    if (filters.search !== debouncedSearchInput) {
      storeFunctions.current.setFilters({ search: debouncedSearchInput });
      storeFunctions.current.setPagination(1); // Reset to first page
      storeFunctions.current.fetchFarmers();
    }
  }, [debouncedSearchInput, filters.search]);

  // Handle search input changes (immediate)
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    // If clearing the search, apply immediately for better UX
    if (value === '' && filters.search !== '') {
      storeFunctions.current.setFilters({ search: '' });
      storeFunctions.current.setPagination(1);
      storeFunctions.current.fetchFarmers();
    }
  }, [filters.search]);

  
  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    storeFunctions.current.setFilters({ search: '' });
    storeFunctions.current.setPagination(1);
    storeFunctions.current.fetchFarmers();
  }, []);

  const handlePageChange = useCallback((page: number) => {
    storeFunctions.current.setPagination(page);
    storeFunctions.current.fetchFarmers();
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    storeFunctions.current.setPagination(1, size); // Reset to first page with new page size
    storeFunctions.current.fetchFarmers();
  }, []);

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

  
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Farmers</h2>
          <p className="text-muted-foreground">
            {pagination.totalItems} farmer{pagination.totalItems !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={onFarmerCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Farmer
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex justify-between items-center">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Button variant="outline" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Search Section */}
      <div className="px-2 py-3 lg:p-6 border-b border-border bg-white dark:bg-black">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search farmers by name..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
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
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden lg:table-cell">Retailer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Address</TableHead>
                  <TableHead className="hidden lg:table-cell">Created By</TableHead>
                  <TableHead className="hidden lg:table-cell">Updated By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && farmers.length === 0 ? (
                  // Show skeleton rows when loading and no data exists
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {farmers.map((farmer) => (
                  <TableRow key={farmer.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{farmer.name}</div>
                        {farmer.email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 md:hidden">
                            <Mail className="h-3 w-3" />
                            {farmer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm max-w-xs">
                        {farmer.retailer ? (
                          <div>
                            <div className="font-medium">{farmer.retailer.name}</div>
                            {farmer.retailer.shop_name && (
                              <div className="text-muted-foreground text-xs">{farmer.retailer.shop_name}</div>
                            )}
                          </div>
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {farmer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {farmer.phone}
                          </div>
                        )}
                        {farmer.email && !farmer.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 md:hidden">
                            <Mail className="h-3 w-3" />
                            {farmer.email.length > 15 ? `${farmer.email.slice(0, 15)}...` : farmer.email}
                          </div>
                        )}
                        {!farmer.phone && !farmer.email && '-'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-sm max-w-xs truncate">
                        {farmer.address || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        {farmer.created_by_employee ? (
                          <div>
                            <div className="font-medium">{farmer.created_by_employee.first_name} {farmer.created_by_employee.last_name}</div>
                            <div className="text-muted-foreground">{farmer.created_by_employee.human_readable_user_id}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Admin</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        {farmer.updated_by_employee ? (
                          <div>
                            <div className="font-medium">{farmer.updated_by_employee.first_name} {farmer.updated_by_employee.last_name}</div>
                            <div className="text-muted-foreground">{farmer.updated_by_employee.human_readable_user_id}</div>
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
                          onClick={() => onFarmerSelect?.(farmer)}
                          className="cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onFarmerEdit?.(farmer)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                                ))}
                    </>
                )}
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
        </div>
      )}

      {/* Empty State */}
      {!loading && farmers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No farmers found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by adding your first farmer.
          </p>
          <Button onClick={onFarmerCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Farmer
          </Button>
        </div>
      )}
    </div>
  );
}