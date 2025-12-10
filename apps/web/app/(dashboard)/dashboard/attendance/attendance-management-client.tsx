'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useDebounce } from '@/lib/utils/debounce';
import { useAttendanceStore } from '@/app/lib/stores/attendanceStore';
import { DailyAttendanceRecord, VerificationStatus } from '@pgn/shared';
import { AttendanceTable, AttendanceDetailsModal } from '@/components/attendance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Search, Filter, X, Calendar, CalendarX } from 'lucide-react';

export default function AttendanceManagementClient() {
  const {
    attendanceRecords,
    isLoading,
    error,
    updateError,
    pagination,
    filter,
    fetchAttendanceRecords,
    updateAttendanceVerification,
    setFilters,
    setPagination,
    clearError,
    clearUpdateError,
  } = useAttendanceStore();

  const VERIFICATION_STATUS_OPTIONS: VerificationStatus[] = ['PENDING', 'VERIFIED', 'REJECTED', 'FLAGGED'];

  // Local state for search input (immediate updates)
  const [searchInput, setSearchInput] = useState(filter.search || '');
  const debouncedSearchInput = useDebounce(searchInput, 300);

  // Date picker state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    filter.date ? new Date(filter.date) : undefined
  );

  const [selectedAttendance, setSelectedAttendance] = useState<DailyAttendanceRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Use refs to track current values to prevent infinite loops
  const prevPaginationRef = useRef(pagination);

  // Load initial data only once
  useEffect(() => {
    fetchAttendanceRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Handle search changes when debounced value updates
  useEffect(() => {
    if (filter.search !== debouncedSearchInput) {
      setFilters({ search: debouncedSearchInput });
      setPagination(1); // Reset to first page
      fetchAttendanceRecords();
    }
  }, [debouncedSearchInput, filter.search, setFilters, setPagination, fetchAttendanceRecords]);

  // Handle search input changes (immediate)
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    // If clearing the search, apply immediately for better UX
    if (value === '' && filter.search !== '') {
      setFilters({ search: '' });
      setPagination(1);
      fetchAttendanceRecords();
    }
  }, [setFilters, setPagination, fetchAttendanceRecords, filter.search]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    if (filter.search !== '') {
      setFilters({ search: '' });
      setPagination(1);
      fetchAttendanceRecords();
    }
  }, [setFilters, setPagination, fetchAttendanceRecords, filter.search]);

  const handleSearchFieldChange = useCallback((value: 'first_name' | 'last_name' | 'employee_id') => {
    setFilters({ searchField: value });
    setPagination(1);
    fetchAttendanceRecords();
  }, [setFilters, setPagination, fetchAttendanceRecords]);

  const handleVerificationStatusChange = useCallback(async (value: VerificationStatus | 'all') => {
    const status = value === 'all' ? undefined : value;
    setFilters({ verificationStatus: status });
    setPagination(1);
    fetchAttendanceRecords();
  }, [setFilters, setPagination, fetchAttendanceRecords]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    const dateStr = date ? date.toISOString().split('T')[0] : undefined;
    setFilters({ date: dateStr });
    setPagination(1);
    fetchAttendanceRecords();
  }, [setFilters, setPagination, fetchAttendanceRecords]);

  const handleClearDate = useCallback(() => {
    setSelectedDate(undefined);
    setFilters({ date: undefined });
    setPagination(1);
    fetchAttendanceRecords();
  }, [setFilters, setPagination, fetchAttendanceRecords]);

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
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">
            {pagination.totalItems} attendance record{pagination.totalItems !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Desktop Layout - selects on sides, search in center */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Left: Search Field Selector */}
            <Select
              value={filter.searchField}
              onValueChange={handleSearchFieldChange}
            >
              <SelectTrigger className="w-48 cursor-pointer">
                <Search className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_name">First Name</SelectItem>
                <SelectItem value="last_name">Last Name</SelectItem>
                <SelectItem value="employee_id">Employee ID</SelectItem>
              </SelectContent>
            </Select>

            {/* Center: Search Input - takes full available width */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search attendance..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10 w-full"
                aria-label="Search attendance"
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

            {/* Right: Date Picker & Status Filter */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-36 justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? selectedDate.toLocaleDateString() : "Date"}
                    {selectedDate && (
                      <CalendarX
                        className="ml-auto h-4 w-4 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearDate();
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Select
                value={filter.verificationStatus || 'all'}
                onValueChange={handleVerificationStatusChange}
              >
                <SelectTrigger className="w-40 cursor-pointer">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {VERIFICATION_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Layout - selects on top, search below */}
          <div className="sm:hidden space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <Select
                  value={filter.searchField}
                  onValueChange={handleSearchFieldChange}
                >
                  <SelectTrigger className="flex-1 cursor-pointer">
                    <Search className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Search by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_name">First Name</SelectItem>
                    <SelectItem value="last_name">Last Name</SelectItem>
                    <SelectItem value="employee_id">Employee ID</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? selectedDate.toLocaleDateString() : "Date"}
                      {selectedDate && (
                        <CalendarX
                          className="ml-auto h-4 w-4 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearDate();
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Select
                value={filter.verificationStatus || 'all'}
                onValueChange={handleVerificationStatusChange}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {VERIFICATION_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search attendance..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10 w-full"
                aria-label="Search attendance"
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2 lg:p-4 flex justify-between items-center">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <Button variant="outline" size="sm" onClick={clearError} className="cursor-pointer">
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
          updateError={updateError || undefined}
        />
      </div>
    </div>
  );
}