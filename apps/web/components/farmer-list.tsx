/**
 * Farmer List Component
 * Displays a searchable, filterable, and paginated list of farmers
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
import { Farmer } from '@pgn/shared';
import { useFarmerStore } from '@/app/lib/stores/farmerStore';
import { Search, Plus, Edit, Eye, Mail, Phone, User, Store } from 'lucide-react';

interface FarmerListProps {
  onFarmerSelect?: (farmer: Farmer) => void;
  onFarmerEdit?: (farmer: Farmer) => void;
  onFarmerCreate?: () => void;
}

export function FarmerList({
  onFarmerSelect,
  onFarmerEdit,
  onFarmerCreate,
}: FarmerListProps) {
  const {
    farmers,
    retailers,
    loading,
    loadingRetailers,
    error,
    pagination,
    filters,
    fetchFarmers,
    fetchRetailers,
    setFilters,
    setPagination,
    clearError,
  } = useFarmerStore();

  useEffect(() => {
    fetchRetailers();
  }, [fetchRetailers]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
    setPagination(1); // Reset to first page
  };

  const handleRetailerFilterChange = (value: string) => {
    setFilters({ retailer_id: value || undefined });
    setPagination(1); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPagination(1, size); // Reset to first page with new page size
  };

  if (loading && farmers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Farmers</h2>
          <Button onClick={onFarmerCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Farmer
          </Button>
        </div>
        <div className="p-4 lg:p-6 border-b border-border bg-white dark:bg-black">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="hidden lg:block bg-white dark:bg-black">
          <div className="p-6">
            <div className="w-full overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Farm Name</TableHead>
                    <TableHead>Retailer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
        <div className="lg:hidden">
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 bg-white dark:bg-black">
                <div className="flex gap-4 mb-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

      {/* Search and Filter Section */}
      <div className="p-4 lg:p-6 border-b border-border bg-white dark:bg-black">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search farmers by name..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.retailer_id || ''}
            onValueChange={(value) => handleRetailerFilterChange(value)}
            disabled={loadingRetailers}
          >
            <SelectTrigger className="w-full sm:w-48">
              <Store className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by retailer">
                {filters.retailer_id ? retailers.find(r => r.id === filters.retailer_id)?.name : "All Retailers"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Retailers</SelectItem>
              {retailers.map((retailer) => (
                <SelectItem key={retailer.id} value={retailer.id}>
                  {retailer.name}
                  {retailer.shop_name && ` - ${retailer.shop_name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop/Tablet View - Table */}
      <div className="hidden lg:block bg-white dark:bg-black">
        <div className="p-6">
          <div className="w-full overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Farm Name</TableHead>
                  <TableHead>Retailer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map((farmer) => (
                  <TableRow key={farmer.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{farmer.name}</div>
                        {farmer.email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {farmer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {farmer.farm_name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs">
                        {farmer.retailer_id ? (
                          <Badge variant="secondary" className="text-xs">
                            Retailer ID: {farmer.retailer_id.slice(0, 8)}...
                          </Badge>
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
                        {!farmer.phone && !farmer.email && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs truncate">
                        {farmer.address || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(farmer.created_at).toLocaleDateString()}
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
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Mobile View - App-style List */}
      <div className="lg:hidden">
        <div className="divide-y divide-border">
          {farmers.map((farmer) => (
            <div key={farmer.id} className="p-4 bg-white dark:bg-black">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{farmer.name}</h3>
                  {farmer.farm_name && (
                    <p className="text-sm text-muted-foreground">
                      Farm: {farmer.farm_name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFarmerSelect?.(farmer)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFarmerEdit?.(farmer)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {farmer.retailer_id && (
                  <div className="text-sm flex items-center gap-1">
                    <Store className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Retailer:</span>
                    <Badge variant="secondary" className="text-xs">
                      ID: {farmer.retailer_id.slice(0, 8)}...
                    </Badge>
                  </div>
                )}

                {farmer.email && (
                  <div className="text-sm flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Email:</span> {farmer.email}
                  </div>
                )}

                {farmer.phone && (
                  <div className="text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Phone:</span> {farmer.phone}
                  </div>
                )}

                {farmer.address && (
                  <div className="text-sm">
                    <span className="font-medium">Address:</span> {farmer.address}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Created: {new Date(farmer.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
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