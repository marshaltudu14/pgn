'use client';

import { useEffect, useState, useRef } from 'react';
import { useAttendanceStore } from '@/app/lib/stores/attendanceStore';
import { DailyAttendanceRecord, VerificationStatus } from '@pgn/shared';
import { AttendanceTable, AttendanceDetailsModal } from '@/components/attendance';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

export default function AttendanceManagementClient() {
  const {
    attendanceRecords,
    isLoading,
    isUpdating,
    error,
    updateError,
    pagination,
    fetchAttendanceRecords,
    updateAttendanceVerification,
    setPagination,
    clearError,
    clearUpdateError,
  } = useAttendanceStore();

  const [selectedAttendance, setSelectedAttendance] = useState<DailyAttendanceRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Use refs to track current values to prevent infinite loops
  const prevPaginationRef = useRef(pagination);

  // Load initial data only once
  useEffect(() => {
    fetchAttendanceRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Handle pagination changes
  useEffect(() => {
    const store = useAttendanceStore.getState();
    const currentPagination = store.pagination;

    // Only fetch if pagination actually changed
    if (JSON.stringify(currentPagination) !== JSON.stringify(prevPaginationRef.current)) {
      store.fetchAttendanceRecords();
      prevPaginationRef.current = { ...currentPagination };
    }
  }, [pagination]); // Monitor changes but prevent infinite loops

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(page);
  };

  // Handle attendance record selection
  const handleAttendanceSelect = (record: DailyAttendanceRecord) => {
    setSelectedAttendance(record);
    setShowDetailsModal(true);
  };

  // Handle verification status update
  const handleVerificationUpdate = async (recordId: string, status: VerificationStatus, notes?: string) => {
    try {
      await updateAttendanceVerification(recordId, status, notes);
      setShowDetailsModal(false);
      toast.success(`Attendance ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Failed to update verification status:', error);
      toast.error('Failed to update verification status');
    }
  };

  // Handle modal close with error clearing
  const handleModalClose = (open: boolean) => {
    if (!open) {
      clearUpdateError();
      setSelectedAttendance(null);
    }
    setShowDetailsModal(open);
  };

  
  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="hover:text-primary transition-colors">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Attendance</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">
            {pagination.totalItems} attendance record{pagination.totalItems !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex justify-between items-center">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <Button variant="outline" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Attendance Table */}
        <AttendanceTable
          attendanceRecords={attendanceRecords}
          isLoading={isLoading}
          onRecordSelect={handleAttendanceSelect}
          onPageChange={handlePageChange}
          pagination={pagination}
        />

        {/* Attendance Details Modal */}
        <AttendanceDetailsModal
          open={showDetailsModal}
          onOpenChange={handleModalClose}
          attendanceRecord={selectedAttendance}
          onVerificationUpdate={handleVerificationUpdate}
          isUpdating={isUpdating}
          updateError={updateError || undefined}
        />
      </div>
    </div>
  );
}