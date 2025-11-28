/**
 * Retailer List Component
 * Displays a searchable, filterable, and paginated list of retailers
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Retailer } from '@pgn/shared';
import { useRetailerStore } from '@/app/lib/stores/retailerStore';
import { Search, Plus, Edit, Eye, Store, Mail, Phone, Building2 } from 'lucide-react';

interface RetailerListProps {
  onRetailerSelect?: (retailer: Retailer) => void;
  onRetailerEdit?: (retailer: Retailer) => void;
  onRetailerCreate?: () => void;
}

export function RetailerList({
  onRetailerSelect,
  onRetailerEdit,
  onRetailerCreate,
}: RetailerListProps) {
  const {
    retailers,
    dealers,
    loading,
    loadingDealers,
    error,
    pagination,
    filters,
    fetchRetailers,
    fetchDealers,
    setFilters,
    setPagination,
    clearError,
  } = useRetailerStore();

  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

  useEffect(() => {
    fetchRetailers();
  }, [fetchRetailers]);

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
    setPagination(1); // Reset to first page
  };

  const handleDealerFilterChange = (value: string) => {
    setFilters({ dealer_id: value === 'all' ? undefined : value });
    setPagination(1); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPagination(1, size); // Reset to first page with new page size
  };

  if (loading && retailers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Retailers</h2>
          <Button onClick={onRetailerCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Retailer
          </Button>
        </div>
        <div className="px-2 py-3 lg:p-6 border-b border-border bg-white dark:bg-black">
          <div className="flex gap-4">
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
                    <TableHead className="hidden lg:table-cell">Dealer</TableHead>
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
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
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
          <h2 className="text-2xl font-bold">Retailers</h2>
          <p className="text-muted-foreground">
            {pagination.totalItems} retailer{pagination.totalItems !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={onRetailerCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Retailer
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

      {/* Search and Filter Section */}
      <div className="px-2 py-3 lg:p-6 border-b border-border bg-white dark:bg-black">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search retailers by name..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.dealer_id || 'all'}
            onValueChange={(value) => handleDealerFilterChange(value)}
            disabled={loadingDealers}
          >
            <SelectTrigger className="w-full sm:w-48">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by dealer">
                {filters.dealer_id ? dealers.find(d => d.id === filters.dealer_id)?.name : "All Dealers"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dealers</SelectItem>
              {dealers.map((dealer) => (
                <SelectItem key={dealer.id} value={dealer.id}>
                  {dealer.name}
                  {dealer.shop_name && ` - ${dealer.shop_name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <TableHead className="hidden lg:table-cell">Dealer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Address</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retailers.map((retailer) => (
                  <TableRow key={retailer.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{retailer.name}</div>
                        {retailer.email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 md:hidden">
                            <Mail className="h-3 w-3" />
                            {retailer.email.length > 15 ? `${retailer.email.slice(0, 15)}...` : retailer.email}
                          </div>
                        )}
                        {retailer.shop_name && (
                          <div className="text-sm text-muted-foreground md:hidden flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {retailer.shop_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <span>{retailer.shop_name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm max-w-xs">
                        {retailer.dealer_id ? (
                          <Badge variant="secondary" className="text-xs">
                            Dealer ID: {retailer.dealer_id.slice(0, 8)}...
                          </Badge>
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {retailer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {retailer.phone}
                          </div>
                        )}
                        {retailer.email && !retailer.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 md:hidden">
                            <Mail className="h-3 w-3" />
                            {retailer.email.length > 15 ? `${retailer.email.slice(0, 15)}...` : retailer.email}
                          </div>
                        )}
                        {!retailer.phone && !retailer.email && '-'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-sm max-w-xs truncate">
                        {retailer.address || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-sm text-muted-foreground">
                        {new Date(retailer.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRetailerSelect?.(retailer)}
                          className="cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRetailerEdit?.(retailer)}
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
                <SelectTrigger className="w-20">
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
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && retailers.length === 0 && (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No retailers found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by adding your first retailer.
          </p>
          <Button onClick={onRetailerCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Retailer
          </Button>
        </div>
      )}
    </div>
  );
}