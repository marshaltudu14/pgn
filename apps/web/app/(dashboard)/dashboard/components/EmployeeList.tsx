'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DailyAttendanceRecord, Employee } from '@pgn/shared';
import { formatDistanceToNow } from 'date-fns';
import { Battery, BatteryFull, BatteryLow, BatteryMedium, Clock } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  attendanceMap: Record<string, DailyAttendanceRecord>;
  selectedEmployeeId: string | null;
  onSelectEmployee: (employee: Employee) => void;
  isLoading: boolean;
}

export function EmployeeList({ 
  employees, 
  attendanceMap, 
  selectedEmployeeId, 
  onSelectEmployee,
  isLoading 
}: EmployeeListProps) {

  // Helper to determine status color and text
  const getStatusInfo = (employee: Employee, attendance?: DailyAttendanceRecord) => {
    // 1. Not checked in today (Absent)
    if (!attendance || !attendance.checkInTime) {
         return { color: 'bg-slate-500', text: 'Absent', border: 'border-slate-200' };
    }
    
    // 2. Checked Out
    if (attendance.checkOutTime) {
      return { color: 'bg-gray-500', text: 'Checked Out', border: 'border-gray-200' };
    }
    
    // 3. Checked In - Check for "Online" status (update within last 90 seconds)
    // Prioritize lastLocationUpdate, then last path point, then checkInTime
    const lastUpdate = attendance.lastLocationUpdate || 
                       (attendance.locationPath && attendance.locationPath.length > 0 
                         ? attendance.locationPath[attendance.locationPath.length - 1].timestamp 
                         : attendance.checkInTime);
      
    if (lastUpdate) {
      const distinctSeconds = (new Date().getTime() - new Date(lastUpdate).getTime()) / 1000;
      if (distinctSeconds < 90) { 
        return { color: 'bg-green-500', text: 'Online', border: 'border-green-200' };
      }
    }

    // Checked in but not recently updated
    return { color: 'bg-blue-500', text: 'Checked In', border: 'border-blue-200' };
  };

  const getBatteryIcon = (level?: number) => {
    if (level === undefined || level === null) return <Battery className="h-4 w-4 text-gray-300" />;
    if (level > 80) return <BatteryFull className="h-4 w-4 text-green-500" />;
    if (level > 40) return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
    return <BatteryLow className="h-4 w-4 text-red-500" />;
  };

  if (isLoading && employees.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <p className="text-muted-foreground">No employees found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {employees.map((employee) => {
        const attendance = attendanceMap[employee.id];
        const status = getStatusInfo(employee, attendance);
        const batteryLevel = attendance?.locationPath?.length 
          ? attendance.locationPath[attendance.locationPath.length - 1].batteryLevel 
          : (attendance?.batteryLevelAtCheckIn || undefined);

        return (
          <div
            key={employee.id}
            onClick={() => onSelectEmployee(employee)}
            className={cn(
              "relative flex flex-col gap-2 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md",
              selectedEmployeeId === employee.id 
                ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20" 
                : "bg-card border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar / Initials */}
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {employee.first_name[0]}{employee.last_name[0]}
                </div>
                
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-foreground">
                    {employee.first_name} {employee.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {employee.human_readable_user_id}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className={cn("text-xs gap-1.5 px-2", status.border)}>
                    <span className={cn("h-2 w-2 rounded-full", status.color)} />
                    {status.text}
                 </Badge>
              </div>
            </div>

            {/* Meta Info Row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 pl-13">
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1" title="Battery Level">
                    {getBatteryIcon(batteryLevel ? batteryLevel / 100 : undefined)}
                    <span>{batteryLevel !== undefined ? `${Math.round(batteryLevel)}%` : '--'}</span>
                 </div>
                 
                 {attendance?.checkInTime && (
                   <div className="flex items-center gap-1" title="Check In Time">
                     <Clock className="h-3.5 w-3.5" />
                     <span>{new Date(attendance.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                 )}
              </div>
              
              <div className="flex items-center">
                 {attendance?.lastLocationUpdate && (
                   <span title="Last Location Update">
                     Updated {formatDistanceToNow(new Date(attendance.lastLocationUpdate), { addSuffix: true })}
                   </span>
                 )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
