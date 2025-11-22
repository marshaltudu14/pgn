/**
 * Attendance Table Component
 * Displays attendance records with responsive design and pagination
 */

'use client';

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
import { DailyAttendanceRecord } from '@pgn/shared';
import { Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { VERIFICATION_STATUS_CONFIG } from '@pgn/shared';

// Simple inline status badge
const StatusBadge = ({ status }: { status?: string }) => {
  const config = status && status in VERIFICATION_STATUS_CONFIG
    ? VERIFICATION_STATUS_CONFIG[status as keyof typeof VERIFICATION_STATUS_CONFIG]
    : VERIFICATION_STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
};

interface AttendanceTableProps {
  attendanceRecords: DailyAttendanceRecord[];
  isLoading: boolean;
  onRecordSelect: (record: DailyAttendanceRecord) => void;
  onPageChange: (page: number) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export function AttendanceTable({
  attendanceRecords,
  isLoading,
  onRecordSelect,
  onPageChange,
  pagination,
}: AttendanceTableProps) {
  if (isLoading && attendanceRecords.length === 0) {
    return (
      <div className="space-y-4">
        <div className="hidden lg:block bg-white dark:bg-black">
          <div className="p-6">
            <div className="w-full overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Work Hours</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 rounded" /></TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded ml-auto" />
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

  if (attendanceRecords.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 bg-white dark:bg-black">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No attendance records found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or date range to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop/Tablet View - Table */}
      <div className="hidden lg:block bg-white dark:bg-black">
        <div className="p-6">
          <div className="w-full overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        {record.employeeName && (
                          <div className="font-medium">{record.employeeName}</div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {record.humanReadableEmployeeId || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.checkInTime ? (
                        <div className="text-sm font-medium">
                          {format(new Date(record.checkInTime), 'hh:mm a')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.checkOutTime ? (
                        <div className="text-sm font-medium">
                          {format(new Date(record.checkOutTime), 'hh:mm a')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {record.locationPath && record.locationPath.length > 0 ? (
                          <span>Path data</span>
                        ) : (
                          '-'
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {record.device || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.verificationStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRecordSelect(record)}
                        className="cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
          {attendanceRecords.map((record) => (
            <div key={record.id} className="p-4 bg-white dark:bg-black">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {format(new Date(record.date), 'MMM dd, yyyy')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {record.humanReadableEmployeeId || 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={record.verificationStatus} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRecordSelect(record)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm">
                    <span className="font-medium">Check In:</span>{' '}
                    {record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '-'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Check Out:</span>{' '}
                    {record.checkOutTime ? format(new Date(record.checkOutTime), 'hh:mm a') : '-'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm">
                    <span className="font-medium">Work Hours:</span>{' '}
                    {record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Distance:</span>{' '}
                    {record.locationPath && record.locationPath.length > 0 ? (
                      'Path data available'
                    ) : '-'}
                  </div>
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
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} results
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
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
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
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

