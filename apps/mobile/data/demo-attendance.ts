import { DailyAttendanceRecord } from '@pgn/shared';

// Generate demo attendance data based on the schema
export const generateDemoAttendanceData = (page: number = 1, limit: number = 20): DailyAttendanceRecord[] => {
  const data: DailyAttendanceRecord[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - ((page - 1) * limit) + 7); // Start from a week ago to ensure we have recent data

  for (let i = 0; i < limit; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - i);

    // Skip weekends (Saturday = 6, Sunday = 0)
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }

    // Ensure we don't go too far back in time (limit to about 6 months of data)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (currentDate < sixMonthsAgo) {
      continue;
    }

    const attendanceDate = currentDate.toISOString().split('T')[0];
    const employeeId = 'demo-employee-001';
    const id = `attendance-${attendanceDate}-${employeeId}`;

    // Randomly generate attendance data
    const hasCheckedIn = Math.random() > 0.1; // 90% check-in rate
    const hasCheckedOut = hasCheckedIn && Math.random() > 0.05; // 95% check-out rate after check-in

    const checkInHour = 8 + Math.floor(Math.random() * 2); // 8-9 AM
    const checkInMinute = Math.floor(Math.random() * 60);
    const checkOutHour = 17 + Math.floor(Math.random() * 2); // 5-7 PM
    const checkOutMinute = Math.floor(Math.random() * 60);

    // Generate path data for location tracking (JSON field)
    const pathData = hasCheckedIn ? [{
      latitude: 28.6139 + (Math.random() - 0.5) * 0.01,
      longitude: 77.2090 + (Math.random() - 0.5) * 0.01,
      timestamp: (() => {
        const timestampDate = new Date(currentDate);
        timestampDate.setHours(checkInHour, checkInMinute, 0, 0);
        return timestampDate.toISOString();
      })(),
      batteryLevel: Math.floor(Math.random() * 30) + 70, // 70-100%
      accuracy: 10 + Math.random() * 20,
    }] : null;

    const totalDistance = hasCheckedIn ? Math.floor(Math.random() * 5000) + 1000 : null; // 1-6 km in meters

    const record: DailyAttendanceRecord = {
      id,
      employeeId: employeeId,
      date: attendanceDate,
      checkInTime: hasCheckedIn
        ? (() => {
            const checkInDate = new Date(currentDate);
            checkInDate.setHours(checkInHour, checkInMinute, 0, 0);
            return checkInDate;
          })()
        : undefined,
      checkOutTime: hasCheckedOut && hasCheckedOut
        ? (() => {
            const checkOutDate = new Date(currentDate);
            checkOutDate.setHours(checkOutHour, checkOutMinute, 0, 0);
            return checkOutDate;
          })()
        : undefined,
      checkInLocation: hasCheckedIn ? {
        latitude: 28.6139 + (Math.random() - 0.5) * 0.01,
        longitude: 77.2090 + (Math.random() - 0.5) * 0.01,
        accuracy: 10 + Math.random() * 20,
        timestamp: (() => {
          const timestampDate = new Date(currentDate);
          timestampDate.setHours(checkInHour, checkInMinute, 0, 0);
          return timestampDate;
        })(),
      } : undefined,
      status: hasCheckedIn ? (hasCheckedOut ? 'CHECKED_OUT' : 'CHECKED_IN') : 'ABSENT',
      verificationStatus: hasCheckedIn
        ? (Math.random() > 0.2 ? 'VERIFIED' : 'FLAGGED')
        : undefined,
      workHours: hasCheckedIn && hasCheckedOut
        ? parseFloat(((checkOutHour + checkOutMinute/60) - (checkInHour + checkInMinute/60)).toFixed(2))
        : undefined,
      locationPath: pathData ? pathData.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: new Date(point.timestamp),
        accuracy: point.accuracy,
        batteryLevel: point.batteryLevel,
      })) : [],
      createdAt: new Date(currentDate),
      updatedAt: new Date(currentDate),
    };

    data.push(record);
  }

  return data;
};

// Generate current today's status
export const generateTodayStatus = () => {
  const now = new Date();
  const hasCheckedIn = Math.random() > 0.3; // 70% chance of being checked in
  const hasCheckedOut = hasCheckedIn && Math.random() > 0.4; // 60% chance of being checked out

  const checkInTime = hasCheckedIn
    ? new Date(now.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0))
    : null;

  const checkOutTime = hasCheckedOut && hasCheckedOut
    ? new Date(now.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0))
    : null;

  return {
    hasCheckedIn,
    hasCheckedOut,
    checkInTime,
    checkOutTime,
    currentLocation: hasCheckedIn ? 'PGN Head Office, Delhi' : 'Not Available',
    batteryLevel: Math.floor(Math.random() * 30) + 70,
  };
};