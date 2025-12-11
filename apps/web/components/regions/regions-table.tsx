'use client';

import { RegionListParams, RegionSchema } from '@pgn/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Edit, Trash2, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface RegionsTableProps {
  regions: RegionSchema[];
  isLoading: boolean;
  pagination: PaginationState;
  filters: RegionListParams;
  onEdit: (region: RegionSchema) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: 'state' | 'city', sortOrder: 'asc' | 'desc') => void;
}

export function RegionsTable({
  regions,
  isLoading,
  pagination,
  filters,
  onEdit,
  onDelete,
  onPageChange,
  onSortChange,
}: RegionsTableProps) {

  const handleSort = (sortBy: 'state' | 'city') => {
    const newSortOrder =
      filters.sort_by === sortBy && filters.sort_order === 'asc' ? 'desc' : 'asc';
    onSortChange(sortBy, newSortOrder);
  };

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const { currentPage, totalPages } = pagination;

    // Always show first page
    if (currentPage > 3) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink href="#" onClick={() => handlePageChange(1)}>
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
            href="#"
            isActive={i === currentPage}
            onClick={() => handlePageChange(i)}
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
          <PaginationLink href="#" onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-4">

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 cursor-pointer hover:bg-accent"
                onClick={() => handleSort('state')}
              >
                State
                {filters.sort_by === 'state' && (
                  filters.sort_order === 'asc' ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )
                )}
              </Button>
            </TableHead>
            <TableHead className="w-[200px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 cursor-pointer hover:bg-accent"
                onClick={() => handleSort('city')}
              >
                City
                {filters.sort_by === 'city' && (
                  filters.sort_order === 'asc' ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )
                )}
              </Button>
            </TableHead>
            <TableHead className="w-[200px]">State Slug</TableHead>
            <TableHead className="w-[200px]">City Slug</TableHead>
            <TableHead className="w-[120px]">Employees</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading skeleton rows
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[180px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[180px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[180px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[180px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-[60px]" />
                    <Skeleton className="h-8 w-[60px]" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : !regions || regions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">No regions found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or add new regions.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            regions.map((region) => (
              <TableRow key={region.id}>
                <TableCell className="font-medium">{region.state}</TableCell>
                <TableCell>{region.city}</TableCell>
                <TableCell className="text-muted-foreground">{region.state_slug}</TableCell>
                <TableCell className="text-muted-foreground">{region.city_slug}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {region.employee_count || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {region.employee_count === 1 ? 'employee' : 'employees'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(region)}
                      className="h-8"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Region</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{region.city}, {region.state}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(region.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {generatePaginationItems()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  className={pagination.currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}