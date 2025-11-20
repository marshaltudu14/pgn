'use client';

import { Region } from '@pgn/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, MapPin } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RegionsResponse } from '@pgn/shared';

interface RegionsTableProps {
  regions: RegionsResponse;
  isLoading: boolean;
  onEdit: (region: Region) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export function RegionsTable({
  regions,
  isLoading,
  onEdit,
  onDelete,
  onPageChange,
}: RegionsTableProps) {
  const renderPaginationItems = () => {
    const { page, limit, total, hasMore } = regions;
    const totalPages = Math.ceil(total / limit);
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const items = [];

    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => page > 1 && onPageChange(page - 1)}
          className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent transition-colors'}
        />
      </PaginationItem>
    );

    // First page
    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => onPageChange(1)} className="cursor-pointer hover:bg-accent transition-colors">
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <span className="px-2">...</span>
          </PaginationItem>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onPageChange(i)}
            isActive={i === page}
            className="cursor-pointer hover:bg-accent transition-colors"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <span className="px-2">...</span>
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => onPageChange(totalPages)} className="cursor-pointer hover:bg-accent transition-colors">
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => hasMore && onPageChange(page + 1)}
          className={!hasMore ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent transition-colors'}
        />
      </PaginationItem>
    );

    return items;
  };

  if (isLoading) {
    return (
      <div className="hidden lg:block bg-white dark:bg-black">
        <div className="p-6">
          <div className="w-full overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
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
    );
  }

  if (!isLoading && regions.data.length === 0) {
    return (
      <div className="bg-white dark:bg-black">
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No regions found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Start by adding your first region, or adjust your search to see more results.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block bg-white dark:bg-black">
      <div className="p-6">
        <div className="w-full overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.data.map((region) => (
                <TableRow key={region.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {region.state}
                  </TableCell>
                  <TableCell>{region.city}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(region)}
                        disabled={isLoading}
                        className="cursor-pointer hover:bg-accent transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive cursor-pointer hover:bg-destructive/10 transition-colors"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the region &quot;{region.city}, {region.state}&quot;.
                              This action cannot be undone.
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
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {(regions.total > regions.limit || regions.page > 1) && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {regions.total > 0 && (
                <>
                  Showing {((regions.page - 1) * regions.limit) + 1} to{' '}
                  {Math.min(regions.page * regions.limit, regions.total)} of {regions.total} results
                </>
              )}
            </div>
            <Pagination>
              <PaginationContent>{renderPaginationItems()}</PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}