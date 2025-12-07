'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DailyAttendanceRecord, Employee } from '@pgn/shared';
import { Battery, BatteryFull, BatteryLow, BatteryMedium, RefreshCw, Search, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAttendanceStore } from '../../../lib/stores/attendanceStore';
import { useEmployeeStore } from '../../../lib/stores/employeeStore';
import { EmployeeList } from './EmployeeList';
import MapComponent from './MapComponent';

export default function TrackingView() {
  const { 
    employees, 
    fetchEmployees, 
    loading: loadingEmployees 
  } = useEmployeeStore();
  
  const { 
    attendanceRecords, 
    fetchAttendanceRecords, 
    isLoading: loadingAttendance 
  } = useAttendanceStore();

  const [searchQuery, setSearchQuery] = useState('');
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

  // Initial Fetch
  useEffect(() => {
    fetchEmployees({ limit: 30 }); // Reduced from 50 to 30 employees for better performance
    memoizedFetchAttendanceRecords();
  }, [fetchEmployees, memoizedFetchAttendanceRecords]);

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

  // Filter employees
  const filteredEmployees = useMemo(() => {
    const query = searchInSheet || searchQuery;
    if (!query) return employees;
    const lowerQuery = query.toLowerCase();
    return employees.filter(emp =>
      emp.first_name.toLowerCase().includes(lowerQuery) ||
      emp.last_name.toLowerCase().includes(lowerQuery) ||
      emp.human_readable_user_id.toLowerCase().includes(lowerQuery)
    );
  }, [employees, searchQuery, searchInSheet]);

  // Auto-select first employee when none is selected and list changes
  useEffect(() => {
    if (!selectedEmployee && filteredEmployees.length > 0) {
      setSelectedEmployee(filteredEmployees[0]);
    }
    // We intentionally only want this to run when the list changes or selection is null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEmployees]);

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
          <div className="flex items-center p-2 gap-2 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              title="Refresh Data"
              className="relative h-9 px-3 font-mono text-xs cursor-pointer"
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

          <ScrollArea className="flex-1">
             <EmployeeList
               employees={filteredEmployees}
               attendanceMap={attendanceMap}
               selectedEmployeeId={selectedEmployee?.id || null}
               onSelectEmployee={(emp) => {
                 setSelectedEmployee(emp);
               }}
               isLoading={loadingEmployees}
             />
          </ScrollArea>

          <div className="text-xs text-muted-foreground text-center p-2 border-t bg-muted/30">
            Showing {filteredEmployees.length} employees
            {loadingAttendance && <span className="ml-2 animate-pulse text-primary">(Updating...)</span>}
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
                    {getBatteryIcon(selectedBatteryLevel ? selectedBatteryLevel / 100 : undefined)}
                    <span className="text-xs text-muted-foreground">
                      {Math.round(selectedBatteryLevel)}%
                    </span>
                  </div>
                )}

                {/* Check-in Time */}
                {selectedRecord.checkInTime && (
                  <div className="text-xs text-muted-foreground">
                    <span>In: {new Date(selectedRecord.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
        <div className="flex-shrink-0 bg-background border-b p-2 flex items-center gap-2">
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Users className="h-4 w-4 mr-2" />
                {selectedEmployee ? 'Change' : 'Select'} Employee
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
                    placeholder="Search employees..."
                    className="pl-10"
                    value={searchInSheet}
                    onChange={(e) => setSearchInSheet(e.target.value)}
                  />
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

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            title="Refresh Data"
            className="relative font-mono text-xs cursor-pointer"
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
