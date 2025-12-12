'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DailyAttendanceRecord, Employee } from '@pgn/shared';
import { Battery, BatteryFull, BatteryLow, BatteryMedium, RefreshCw, Search, Users, Clock, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAttendanceStore } from '../../../lib/stores/attendanceStore';
import { useEmployeeStore } from '../../../lib/stores/employeeStore';
import { EmployeeList } from './EmployeeList';
import MapComponent from './MapComponent';
import { useRegionsStore } from '../../../lib/stores/regionsStore';
import { RegionSelector } from '@/components/RegionSelector';
import { Form } from '@/components/ui/form';

// Department filter removed - employees table doesn't have department field
// Can be added later when role/department tracking is implemented

export default function TrackingView() {
  const {
    employees,
    fetchEmployees,
    loading: loadingEmployees,
    filters,
    setFilters,
  } = useEmployeeStore();

  const {
    attendanceRecords,
    fetchAttendanceRecords,
    isLoading: loadingAttendance
  } = useAttendanceStore();

  const { regions, isLoading: regionsLoading, fetchRegions } = useRegionsStore();

  // Simple form for RegionSelector (no submission needed)
  const form = useForm({ defaultValues: { region_id: '' } });

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [searchInSheet, setSearchInSheet] = useState('');
  const [previousEmployeeId, setPreviousEmployeeId] = useState<string | null>(null);
  const [shouldCenterMap, setShouldCenterMap] = useState(false);

  // Memoize the fetch function to prevent unnecessary re-renders
  const memoizedFetchAttendanceRecords = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    fetchAttendanceRecords({ date: today, limit: 50 });
  }, [fetchAttendanceRecords]);

  
  // Fetch all regions once on component mount
  useEffect(() => {
    fetchRegions({ limit: 1000 });
  }, [fetchRegions]);

  // Fetch all employees for the selected region once
  useEffect(() => {
    // Fetch all employees without search to get the full list for local filtering
    const fetchParams: Parameters<typeof fetchEmployees>[0] = { limit: 1000 };
    fetchEmployees(fetchParams);
  }, [filters.assigned_regions, fetchEmployees]);

  // Local search filter for employees - search across all fields
  const filteredEmployees = useMemo(() => {
    if (!filters.search) return employees;

    const query = filters.search.toLowerCase();
    return employees.filter(employee => {
      // Search across all relevant fields
      return (
        employee.human_readable_user_id?.toLowerCase().includes(query) ||
        employee.first_name?.toLowerCase().includes(query) ||
        employee.last_name?.toLowerCase().includes(query) ||
        employee.email?.toLowerCase().includes(query) ||
        employee.phone?.toLowerCase().includes(query) ||
        // Also search combined name for better UX
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(query)
      );
    });
  }, [employees, filters.search]);

  // Sort regions alphabetically by city, then state
  const sortedRegions = useMemo(() => {
    if (!regions) return [];
    return [...regions].sort((a, b) => {
      const cityA = a.city.toLowerCase();
      const cityB = b.city.toLowerCase();
      if (cityA < cityB) return -1;
      if (cityA > cityB) return 1;
      // If cities are the same, sort by state
      const stateA = a.state.toLowerCase();
      const stateB = b.state.toLowerCase();
      if (stateA < stateB) return -1;
      if (stateA > stateB) return 1;
      return 0;
    });
  }, [regions]);

  // Set first region as default when regions are loaded
  useEffect(() => {
    if (sortedRegions && sortedRegions.length > 0 && (!filters.assigned_regions || filters.assigned_regions.length === 0)) {
      setFilters({ assigned_regions: [sortedRegions[0].id] });
    }
  }, [sortedRegions, filters.assigned_regions, setFilters]);

  // Update form value when selected region changes
  useEffect(() => {
    const regionId = filters.assigned_regions?.[0] || '';
    form.setValue('region_id', regionId);
  }, [filters.assigned_regions, form]);

  // Initial attendance data fetch
  useEffect(() => {
    memoizedFetchAttendanceRecords();
  }, [memoizedFetchAttendanceRecords]);

  // Polling for updates with countdown
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(35);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          // Use setTimeout to defer the fetch call until after the current render
          setTimeout(memoizedFetchAttendanceRecords, 0);
          return 35;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [memoizedFetchAttendanceRecords]);

  // Merge Data: Create a map of Employee ID -> Attendance Record
  const attendanceMap = useMemo(() => {
    const map: Record<string, DailyAttendanceRecord> = {};
    attendanceRecords.forEach(record => {
      map[record.employeeId] = record;
    });
    return map;
  }, [attendanceRecords]);

  // Use employees directly as filtering is done at database level
  // Still handle mobile search input sync
  useEffect(() => {
    if (searchInSheet && searchInSheet !== filters.search) {
      setFilters({ search: searchInSheet });
    }
  }, [searchInSheet, filters.search, setFilters]);

  // Auto-select first employee when none is selected and list changes
  useEffect(() => {
    if (!selectedEmployee && employees.length > 0) {
      setSelectedEmployee(employees[0]);
    }
    // We intentionally only want this to run when the list changes or selection is null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees]);

  // Track previous employee for map centering control
  useEffect(() => {
    if (selectedEmployee && selectedEmployee.id !== previousEmployeeId) {
      setShouldCenterMap(true);
      setPreviousEmployeeId(selectedEmployee.id);
      // Only center once when employee changes, then disable
      setTimeout(() => setShouldCenterMap(false), 100);
    }
  }, [selectedEmployee, previousEmployeeId]);

  // Handle Refresh Manually
  const handleRefresh = useCallback(() => {
    memoizedFetchAttendanceRecords();
    setTimeUntilRefresh(35);
  }, [memoizedFetchAttendanceRecords]);

  const selectedRecord = selectedEmployee ? attendanceMap[selectedEmployee.id] : null;

  // Helper to get battery icon
  const getBatteryIcon = (level?: number) => {
    if (level === undefined || level === null) return <Battery className="h-4 w-4 text-gray-400" />;
    // Level is already a percentage (0-100), no need to divide
    if (level > 80) return <BatteryFull className="h-4 w-4 text-green-500" />;
    if (level > 40) return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
    return <BatteryLow className="h-4 w-4 text-red-500" />;
  };

  // Get battery level for selected employee
  const selectedBatteryLevel = selectedRecord?.locationPath?.length
    ? selectedRecord.locationPath[selectedRecord.locationPath.length - 1].batteryLevel
    : (selectedRecord?.batteryLevelAtCheckIn || undefined);

  return (
    <div className="h-full w-full overflow-hidden">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full">
        {/* Left Panel - Desktop */}
        <div className="w-1/3 md:min-w-[320px] md:max-w-[400px] h-full flex flex-col bg-background border-r relative z-10">
          {/* Region Filter Row with Timer */}
          <div className="p-2 border-b">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <Form {...form}>
                  <RegionSelector
                    value={filters.assigned_regions?.[0] || ''}
                    onValueChange={(value) => setFilters({ assigned_regions: value ? [value] : [] })}
                    regions={sortedRegions.map(region => ({
                      id: region.id,
                      city: region.city,
                      state: region.state
                    }))}
                    isLoading={regionsLoading}
                    placeholder="Filter by region..."
                  />
                </Form>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                title="Refresh Data"
                className="relative h-12 px-3 font-mono text-xs cursor-pointer whitespace-nowrap"
                disabled={loadingAttendance}
              >
                {loadingAttendance ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {timeUntilRefresh}s
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Search Input Row - Bottom */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, email, or phone..."
                className="pl-8 pr-8 h-9 w-full"
                value={filters.search || ''}
                onChange={(e) => setFilters({ search: e.target.value })}
              />
              {filters.search && (
                <button
                  onClick={() => setFilters({ search: '' })}
                  className="absolute right-2 top-2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
             {loadingEmployees && employees.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-32 text-center p-8">
                 <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                 <p className="text-sm text-muted-foreground">Loading employees...</p>
               </div>
             ) : (
               <EmployeeList
                 employees={filteredEmployees}
                 attendanceMap={attendanceMap}
                 selectedEmployeeId={selectedEmployee?.id || null}
                 onSelectEmployee={(emp) => {
                   setSelectedEmployee(emp);
                 }}
                 isLoading={false}
               />
             )}
          </ScrollArea>

          <div className="text-xs text-muted-foreground text-center p-2 border-t bg-muted/30 flex items-center justify-center gap-2">
            <span>Showing {employees.length} employees</span>
            {loadingAttendance && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Updating...</span>
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 bg-muted/5 overflow-hidden relative">
          <MapComponent
            selectedRecord={selectedRecord || null}
            employeeName={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : undefined}
            shouldCenter={shouldCenterMap}
          />

          {!selectedEmployee && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur px-3 py-1.5 rounded-md shadow-sm z-[400] text-xs font-medium border">
              Select an employee to view their location
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-full flex flex-col">
        {/* Employee Info Header - Mobile */}
        {selectedEmployee && selectedRecord ? (
          <div className="flex-shrink-0 bg-background border-b p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                  {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-sm truncate">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedEmployee.human_readable_user_id}
                  </span>
                  {/* Status */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`h-2 w-2 rounded-full ${
                      selectedRecord.checkOutTime
                        ? 'bg-gray-500'
                        : (selectedRecord.lastLocationUpdate &&
                           (new Date().getTime() - new Date(selectedRecord.lastLocationUpdate).getTime()) / 1000 < 90)
                          ? 'bg-green-500'
                          : selectedRecord.checkInTime
                            ? 'bg-blue-500'
                            : 'bg-slate-500'
                    }`} />
                    <span className="text-xs text-muted-foreground">
                      {selectedRecord.checkOutTime
                        ? 'Checked Out'
                        : (selectedRecord.lastLocationUpdate &&
                           (new Date().getTime() - new Date(selectedRecord.lastLocationUpdate).getTime()) / 1000 < 90)
                          ? 'Online'
                          : selectedRecord.checkInTime
                            ? 'Checked In'
                            : 'Absent'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {/* Battery Level */}
                {selectedBatteryLevel !== undefined && (
                  <div className="flex items-center gap-1" title="Battery Level">
                    {getBatteryIcon(selectedBatteryLevel)}
                    <span className="text-xs text-muted-foreground">
                      {Math.round(selectedBatteryLevel)}%
                    </span>
                  </div>
                )}

                {/* Last Location Update Time */}
                {selectedRecord.lastLocationUpdate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground text-right">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(selectedRecord.lastLocationUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                )}

                {/* Last Update */}
                {selectedRecord.lastLocationUpdate && (
                  <div className="text-xs text-muted-foreground text-right">
                    <span>Updated {formatDistanceToNow(new Date(selectedRecord.lastLocationUpdate), { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : selectedEmployee ? (
          <div className="flex-shrink-0 bg-background border-b p-3">
            <div className="text-center text-sm text-muted-foreground">
              No attendance data for {selectedEmployee.first_name} {selectedEmployee.last_name}
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 bg-background border-b p-3">
            <div className="text-center text-sm text-muted-foreground">
              No employee selected
            </div>
          </div>
        )}

        {/* Mobile Controls */}
        <div className="flex-shrink-0 bg-background border-b p-2 space-y-2">
          {/* Region Filter Row with Timer */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <Form {...form}>
                <RegionSelector
                  value={filters.assigned_regions?.[0] || ''}
                  onValueChange={(value) => setFilters({ assigned_regions: value ? [value] : [] })}
                  regions={sortedRegions.map(region => ({
                    id: region.id,
                    city: region.city,
                    state: region.state
                  }))}
                  isLoading={regionsLoading}
                  placeholder="Filter by region..."
                />
              </Form>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              title="Refresh Data"
              className="relative h-12 px-3 font-mono text-xs cursor-pointer whitespace-nowrap"
              disabled={loadingAttendance}
            >
              {loadingAttendance ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <>{timeUntilRefresh}s</>
              )}
            </Button>
          </div>

          {/* Search Input Row */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, email, or phone..."
              className="pl-10 pr-10 w-full"
              value={searchInSheet}
              onChange={(e) => setSearchInSheet(e.target.value)}
            />
            {searchInSheet && (
              <button
                onClick={() => {
                  setSearchInSheet('');
                  setFilters({ search: '' });
                }}
                className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Employee Select Button */}
          <div className="flex items-center gap-2">
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer flex-1">
                  <Users className="h-4 w-4 mr-2" />
                  {selectedEmployee ? 'Change Employee' : 'Select Employee'}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] z-[1000]">
                <SheetHeader>
                  <SheetTitle>Select Employee</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-4 h-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, ID, email, or phone..."
                      className="pl-10 pr-10"
                      value={searchInSheet}
                      onChange={(e) => setSearchInSheet(e.target.value)}
                    />
                    {searchInSheet && (
                      <button
                        onClick={() => {
                          setSearchInSheet('');
                          setFilters({ search: '' });
                        }}
                        className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                        title="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <ScrollArea className="flex-1">
                    <EmployeeList
                      employees={filteredEmployees}
                      attendanceMap={attendanceMap}
                      selectedEmployeeId={selectedEmployee?.id || null}
                      onSelectEmployee={(emp) => {
                        setSelectedEmployee(emp);
                        setIsMobileSheetOpen(false);
                      }}
                      isLoading={loadingEmployees}
                    />
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Map - Mobile */}
        <div className="flex-1 bg-muted/5 overflow-hidden relative">
          <MapComponent
            selectedRecord={selectedRecord || null}
            employeeName={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : undefined}
            shouldCenter={shouldCenterMap}
          />

          {!selectedEmployee && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur px-3 py-1.5 rounded-md shadow-sm z-[400] text-xs font-medium border">
              Tap &quot;Select Employee&quot; to view their location
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
