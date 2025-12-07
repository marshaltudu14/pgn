# Story 1.3: Service Health Monitoring & Recovery

Status: Ready for Review

## Story

As a field employee,
I want the app to automatically handle service interruptions,
so that my attendance is properly recorded even if the tracking service stops unexpectedly.

## Acceptance Criteria

1. Given I open the app (including after restart), when the attendance store initializes, then it checks for active tracking in emergency data
2. And if user is already checked out, then no action is taken (even if service was interrupted)
3. And if trackingActive: true in emergency data but service is not running, then the system performs emergency check-out
4. And attendance is marked with reason: "Service interrupted - service stopped"
5. And emergency data is cleared
6. Given the service is still running when app opens, then tracking continues without interruption (app restart doesn't matter)

## Tasks / Subtasks

- [x] Task 1: Implement Service Health Check on App Initialization (AC: 1, 2, 6)
  - [x] Subtask 1.1: Add emergency data check in attendance store initialization
  - [x] Subtask 1.2: Check current attendance status (CHECKED_IN vs CHECKED_OUT)
  - [x] Subtask 1.3: If already CHECKED_OUT, skip all service checks
  - [x] Subtask 1.4: If CHECKED_IN, check if service is running via isTrackingActive()
- [x] Task 2: Implement Emergency Check-out for Service Failure (AC: 3, 4, 5)
  - [x] Subtask 2.1: Detect scenario: CHECKED_IN but service not running
  - [x] Subtask 2.2: Trigger emergency check-out with "Service interrupted - service stopped" reason
  - [x] Subtask 2.3: Use last known location from emergency data for check-out
  - [x] Subtask 2.4: Clear emergency data after check-out
- [x] Task 3: Add Error Handling for Edge Cases
  - [x] Subtask 3.1: Handle corrupted or missing emergency data
  - [x] Subtask 3.2: Handle cases where emergency data exists but user is CHECKED_OUT
  - [x] Subtask 3.3: Log all service health checks for debugging
- [x] Task 4: Write Tests for Service Health Logic
  - [x] Subtask 4.1: Unit tests for CHECKED_IN + service running (no action)
  - [x] Subtask 4.2: Unit tests for CHECKED_IN + service stopped (emergency check-out)
  - [x] Subtask 4.3: Unit tests for CHECKED_OUT + any service state (no action)

## Dev Notes

- Service runs independently of app - app restart doesn't matter if service is active
- Service is responsible for sending location updates to database at 5-minute intervals
- Only check service state when user is CHECKED_IN
- If user is CHECKED_OUT, do nothing even if emergency data exists
- Check current attendance status before checking service state
- Use existing isTrackingActive() method to verify service is running

### Project Structure Notes

- Modify apps/mobile/store/attendance-store.ts initialization
- Add attendance status check before service health check
- Use existing locationTrackingServiceNotifee.isTrackingActive() method
- Use existing attendance store currentStatus to check if CHECKED_IN
- Emergency check-out should use existing checkOut() with emergency flag and reason

### References

- [Source: docs/architecture.md#Service Architecture] - "Service death detection on app restart"
- [Source: docs/epics.md#Epic 1] - Story 1.3 detailed requirements
- [Source: apps/mobile/services/location-foreground-service-notifee.ts] - Existing emergency data methods

## Dev Agent Record

- Implemented service health check on app initialization using `onRehydrateStorage` callback
- Added logic to detect service interruptions and trigger emergency check-out
- Implemented error handling for corrupted or missing emergency data
- Added comprehensive unit tests covering all acceptance criteria

### Context Reference

### Agent Model Used
Claude Sonnet

### Debug Log References

### Completion Notes List
- Task 1: Complete - Service health check added to attendance store initialization
- Task 2: Complete - Emergency check-out implemented using existing `emergencyCheckOut` method
- Task 3: Complete - Error handling added for corrupted data, missing data, and edge cases
- Task 4: Complete - All 5 unit tests written and passing

### File List

- apps/mobile/store/attendance-store.ts (added `checkServiceHealthOnInitialization` function and `onRehydrateStorage` callback)
- apps/mobile/store/__tests__/attendance-store.test.ts (added Service Health Monitoring test suite)