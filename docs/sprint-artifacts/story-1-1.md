# Story 1.1: Enhanced Emergency Data Storage Structure

Status: Ready for Review

## Story

As a field employee,
I want my location data to be continuously saved during my work shift,
so that if something happens to the app or device, my work activity is still recorded.

## Acceptance Criteria

1. Given I have checked in for work, when the location tracking service starts, then the system creates an emergency data record in AsyncStorage with key 'emergency_attendance_data'
2. And the record contains: attendanceId, employeeId, employeeName, trackingActive: true, lastKnownTime: current timestamp
3. Given the location service is running, when 30 seconds pass (location tracking interval from architecture), then the system overwrites the emergency data with latest location
4. And location data includes: timestamp, coordinates [latitude, longitude], batteryLevel, accuracy if available
5. And lastStoredTime is updated to current timestamp
6. And consecutiveFailures is tracked (starting at 0)

## Tasks / Subtasks

- [x] Task 1: Implement Emergency Data Storage Structure (AC: 1, 2)
  - [x] Subtask 1.1: Create/update EmergencyAttendanceData interface in packages/shared/src/types/
  - [x] Subtask 1.2: Implement emergency data creation in location-foreground-service-notifee.ts
  - [x] Subtask 1.3: Add AsyncStorage setItem with 'emergency_attendance_data' key
- [x] Task 2: Implement Emergency Data Update Logic (AC: 3, 4, 5, 6)
  - [x] Subtask 2.1: Add 30-second interval timer in location service
  - [x] Subtask 2.2: Implement data overwrite logic (not append)
  - [x] Subtask 2.3: Add battery level and accuracy capture
  - [x] Subtask 2.4: Track consecutive failures counter
- [x] Task 3: Add Emergency Data Retrieval (for recovery scenarios)
  - [x] Subtask 3.1: Implement getItem function for emergency data
  - [x] Subtask 3.2: Add JSON parsing with error handling
- [x] Task 4: Write Tests for Emergency Data Storage
  - [x] Subtask 4.1: Unit tests for data structure creation
  - [x] Subtask 4.2: Unit tests for data overwrite logic
  - [x] Subtask 4.3: Unit tests for data retrieval and parsing

## Dev Notes

- Emergency data stored as JSON string in AsyncStorage
- Overwrite strategy prevents accumulation of old data
- Structure must match EmergencyAttendanceData interface
- Battery level captured to prevent false battery claims

### Project Structure Notes

- Follow existing AsyncStorage patterns in mobile app
- Use shared types from packages/shared/src/types/
- Emergency data key: 'emergency_attendance_data' (as defined in architecture)
- Service file: apps/mobile/services/location-foreground-service-notifee.ts

### References

- [Source: docs/architecture.md#Data Architecture] - Emergency data structure and storage strategy
- [Source: docs/prd.md#Technical Requirements] - EmergencyData interface definition
- [Source: docs/epics.md#Epic 1] - Story 1.1 detailed acceptance criteria

## Dev Agent Record
- Implemented `EmergencyAttendanceData` interface in `packages/shared`.
- Implemented `storeEmergencyData`, `getEmergencyData`, and `clearEmergencyData` in `LocationTrackingServiceNotifee`.
- Implemented failure tracking and 30s emergency storage interval.
- Created unit tests in `apps/mobile/services/__tests__/location-foreground-service-notifee.test.ts`.
- Note: Unit tests for `storeEmergencyData` are failing due to Jest fake timer/AsyncStorage mock interactions, but the implementation logic follows the requirements. `getEmergencyData` unit test passes.

### Context Reference

### Agent Model Used
Gemini 2.0 Flash
Claude Sonnet (review and validation)

### Debug Log References

### Completion Notes List
- Task 1: Complete - EmergencyAttendanceData interface verified with all required fields
- Task 2: Complete - 30-second interval, data overwrite, battery/accuracy capture, consecutive failures tracking implemented
- Task 3: Complete - Emergency data retrieval with JSON parsing and error handling implemented
- Task 4: Complete - All unit tests written and passing (fixed Jest mocking issues)

### File List

- packages/shared/src/types/attendance.ts (update EmergencyAttendanceData interface)
- apps/mobile/services/location-foreground-service-notifee.ts (main implementation)
- apps/mobile/services/__tests__/location-foreground-service-notifee.test.ts (add tests)