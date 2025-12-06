'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DailyAttendanceRecord, Employee } from '@pgn/shared';
import { RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

  // Initial Fetch
  useEffect(() => {
    fetchEmployees({ limit: 50 }); // Fetch top 50 employees initially

    const today = new Date().toISOString().split('T')[0];
    fetchAttendanceRecords({ date: today, limit: 100 }); // Fetch attendance for today
  }, [fetchEmployees, fetchAttendanceRecords]);

  // Polling for updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      fetchAttendanceRecords({ date: today, limit: 100 });
      console.log('Refreshing tracking data...');
    }, 35000);

    return () => clearInterval(interval);
  }, [fetchAttendanceRecords]);

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
    if (!searchQuery) return employees;
    const lowerQuery = searchQuery.toLowerCase();
    return employees.filter(emp =>
      emp.first_name.toLowerCase().includes(lowerQuery) ||
      emp.last_name.toLowerCase().includes(lowerQuery) ||
      emp.human_readable_user_id.toLowerCase().includes(lowerQuery)
    );
  }, [employees, searchQuery]);

  // Auto-select first employee when none is selected and list changes
  useEffect(() => {
    if (!selectedEmployee && filteredEmployees.length > 0) {
      setSelectedEmployee(filteredEmployees[0]);
    }
    // We intentionally only want this to run when the list changes or selection is null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEmployees]);

  // Handle Refresh Manually
  const handleRefresh = () => {
    const today = new Date().toISOString().split('T')[0];
    fetchAttendanceRecords({ date: today, limit: 100 });
  };

  const selectedRecord = selectedEmployee ? attendanceMap[selectedEmployee.id] : null;

  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-4 p-4 overflow-hidden">
      {/* List Panel: Top (35%) on mobile, Left side (30%) on desktop */}
      <div className="w-full md:w-1/3 md:min-w-[320px] md:max-w-[400px] h-[35%] md:h-full flex flex-col gap-4 bg-background rounded-xl border shadow-sm p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh Data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
           <EmployeeList 
             employees={filteredEmployees}
             attendanceMap={attendanceMap}
             selectedEmployeeId={selectedEmployee?.id || null}
             onSelectEmployee={setSelectedEmployee}
             isLoading={loadingEmployees}
           />
        </ScrollArea>
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Showing {filteredEmployees.length} employees
          {loadingAttendance && <span className="ml-2 animate-pulse text-primary">(Updating...)</span>}
        </div>
      </div>

      {/* Right Panel: Map */}
      <div className="flex-1 bg-muted/10 rounded-xl border overflow-hidden shadow-sm h-full relative">
        <MapComponent 
          selectedRecord={selectedRecord || null} 
          employeeName={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : undefined}
        />
        
        {!selectedEmployee && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur px-4 py-2 rounded-full shadow-md z-[400] text-sm font-medium border">
            Select an employee to view their location
          </div>
        )}
      </div>
    </div>
  );
}
