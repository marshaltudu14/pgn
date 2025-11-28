/**
 * Dealer List Component
 * Displays a searchable, filterable, and paginated list of dealers
 * Responsive design: table for desktop/tablet, mobile list for mobile
 */

'use client';

import { useEffect } from 'react';
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
import { Dealer } from '@pgn/shared';
import { useDealerStore } from '@/app/lib/stores/dealerStore';
import { Search, Plus, Edit, Eye, Building, Mail, Phone } from 'lucide-react';

interface DealerListProps {
  onDealerSelect?: (dealer: Dealer) => void;
  onDealerEdit?: (dealer: Dealer) => void;
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

  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
    setPagination(1); // Reset to first page
  };

  const handleShopNameFilterChange = (value: string) => {
    setFilters({ shop_name: value || undefined });
    setPagination(1); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPagination(1, size); // Reset to first page with new page size
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
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="bg-white dark:bg-black">
          <div className="px-2 py-3 lg:p-6">
            <div className="w-full overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Shop Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="hidden xl:table-cell">Address</TableHead>
                    <TableHead className="hidden sm:table-cell">Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-8 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-8 w-24" /></TableCell>
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
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Filter by shop name..."
              value={filters.shop_name || ''}
              onChange={(e) => handleShopNameFilterChange(e.target.value)}
              className="pl-10"
            />
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
                  <TableHead className="hidden md:table-cell">Shop Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Address</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
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
                        {dealer.shop_name && (
                          <div className="text-sm text-muted-foreground md:hidden flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {dealer.shop_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{dealer.shop_name || '-'}</span>
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
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-sm text-muted-foreground">
                        {new Date(dealer.created_at).toLocaleDateString()}
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
        <div className="p-4 lg:p-6 border-t border-border bg-white dark:bg-black">
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