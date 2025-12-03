'use client';

import { Region, RegionFilter } from '@pgn/shared';
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
import { Edit, Trash2, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface RegionsTableProps {
  regions: Region[];
  isLoading: boolean;
  onEdit: (region: Region) => void;
  onDelete: (id: string) => void;
  filter: RegionFilter;
  setFilter: (filter: Partial<RegionFilter>) => void;
}

export function RegionsTable({
  regions,
  isLoading,
  onEdit,
  onDelete,
  filter,
  setFilter,
}: RegionsTableProps) {

  const handleSort = (sortBy: 'state' | 'city') => {
    const newSortOrder =
      filter.sort_by === sortBy && filter.sort_order === 'asc' ? 'desc' : 'asc';
    setFilter({ sort_by: sortBy, sort_order: newSortOrder });
  };

  const sortedRegions = [...regions].sort((a, b) => {
    const sortBy = filter.sort_by || 'city';
    const sortOrder = filter.sort_order || 'asc';

    if (sortBy === 'city') {
      const compareResult = a.city.localeCompare(b.city);
      return sortOrder === 'asc' ? compareResult : -compareResult;
    } else {
      const compareResult = a.state.localeCompare(b.state);
      return sortOrder === 'asc' ? compareResult : -compareResult;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {regions.length} region{regions.length !== 1 ? 's' : ''} total
          </h3>
          <p className="text-sm text-muted-foreground">
            Showing up to 10 results
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleSort('state')}
              >
                State
                {filter.sort_by === 'state' && (
                  filter.sort_order === 'asc' ? (
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
                className="h-8 px-2"
                onClick={() => handleSort('city')}
              >
                City
                {filter.sort_by === 'city' && (
                  filter.sort_order === 'asc' ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )
                )}
              </Button>
            </TableHead>
            <TableHead className="w-[200px]">State Slug</TableHead>
            <TableHead className="w-[200px]">City Slug</TableHead>
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-[60px]" />
                    <Skeleton className="h-8 w-[60px]" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : sortedRegions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
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
            sortedRegions.map((region: Region) => (
              <TableRow key={region.id}>
                <TableCell className="font-medium">{region.state}</TableCell>
                <TableCell>{region.city}</TableCell>
                <TableCell className="text-muted-foreground">{region.state_slug}</TableCell>
                <TableCell className="text-muted-foreground">{region.city_slug}</TableCell>
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
    </div>
  );
}