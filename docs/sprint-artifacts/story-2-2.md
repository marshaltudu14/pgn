# Story 2.2: Permission Revocation Detection & Response

Status: Ready for Review

## Story

As a field employee,
I want immediate notification if required permissions are revoked,
so that I understand why tracking stopped and can fix the issue.

## Acceptance Criteria

1. Given location tracking is active, when location permission is changed from "Allow all the time" to any other setting, then the system performs immediate emergency check-out
2. And attendance record includes reason: "Emergency - Location permission revoked"
3. And a notification explains: "Location tracking stopped due to permission change"
4. Given location tracking is active, when notification permission is revoked, then the system performs emergency check-out
5. And attendance record includes reason: "Emergency - Notification permission revoked"
6. And the user cannot check in again until notification permission is restored
7. Given location tracking is active, when camera permission is revoked, then the system performs emergency check-out
8. And attendance record includes reason: "Emergency - Camera permission revoked"
9. And future check-ins are blocked until camera permission is restored

## Tasks / Subtasks

- [x] Task 1: Enhance Location Permission Revocation Handling (AC: 1, 2, 3)
  - [x] Subtask 1.1: Verify existing handleLocationPermissionRevoked() method works correctly
  - [x] Subtask 1.2: Ensure notification clearly explains location permission issue
  - [x] Subtask 1.3: Test that check-in is blocked until location permission restored
- [x] Task 2: Implement Notification Permission Revocation Handling (AC: 4, 5, 6)
  - [x] Subtask 2.1: Add notification permission check in startPermissionMonitoring()
  - [x] Subtask 2.2: Create handleNotificationPermissionRevoked() method
  - [x] Subtask 2.3: Block future check-ins until notification permission restored
  - [x] Subtask 2.4: Add clear notification explaining requirement
- [x] Task 3: Implement Camera Permission Revocation Handling (AC: 7, 8, 9)
  - [x] Subtask 3.1: Add camera permission check in startPermissionMonitoring()
  - [x] Subtask 3.2: Create handleCameraPermissionRevoked() method
  - [x] Subtask 3.3: Block future check-ins until camera permission restored
  - [x] Subtask 3.4: Add clear notification explaining requirement
- [x] Task 4: Add Permission Check Before Check-in
  - [x] Subtask 4.1: Verify all permissions before allowing check-in
  - [x] Subtask 4.2: Show specific error message for missing permissions
  - [x] Subtask 4.3: Guide user to settings if permissions revoked
- [x] Task 5: Improve Permission Monitoring Logic
  - [x] Subtask 5.1: Check which specific permission was revoked
  - [x] Subtask 5.2: Call appropriate handler based on permission type
  - [x] Subtask 5.3: Log permission changes for debugging
- [x] Task 6: Write Tests for Permission Revocation Scenarios
  - [x] Subtask 6.1: Unit tests for location permission revocation
  - [x] Subtask 6.2: Unit tests for notification permission revocation
  - [x] Subtask 6.3: Unit tests for camera permission revocation
  - [x] Subtask 6.4: Unit tests for check-in blocking when permissions missing

## Dev Notes

- Location permission revocation is already partially implemented in handleLocationPermissionRevoked()
- Need to add similar handlers for camera and notification permissions
- All three permissions are critical for attendance system:
  - Location: Required for tracking
  - Notification: Required for foreground service
  - Camera: Required for check-in/out selfies
- Check permissions before every check-in attempt
- Use existing permissionService.checkAllPermissions() for validation

### Project Structure Notes

- Modify apps/mobile/services/location-foreground-service-notifee.ts
  - Add camera and notification permission handlers
  - Enhance startPermissionMonitoring() to check all permissions
  - Add specific emergency check-out reasons for each permission
- Modify apps/mobile/store/attendance-store.ts
  - Add permission check before check-in
  - Block check-in if any required permission is missing
- Use existing permissionService for permission checks

### References

- [Source: docs/architecture.md#Permission Monitoring] - "30-second permission monitoring"
- [Source: docs/epics.md#Epic 2] - Story 2.2 detailed requirements
- [Source: apps/mobile/services/permissions.ts] - Existing permission service implementation
- [Source: apps/mobile/services/location-foreground-service-notifee.ts] - Current location permission handling

## Dev Agent Record

### Context Reference
- Project architecture uses permissionService for all permission checks
- Emergency check-out flow uses callback pattern from location service to attendance store
- Permission monitoring runs every 30 seconds when tracking is active

### Agent Model Used
Claude Sonnet (claude-3-5-sonnet-20241022)

### Debug Log References
- Permission revocation warnings logged to console.warn for debugging
- All handlers log warning messages when permissions are revoked during tracking

### Completion Notes List
- Implemented all three permission revocation handlers (location, notification, camera)
- Updated notification message to match AC3: "Location tracking stopped due to permission change"
- Added permission check before check-in with detailed error messages
- Enhanced permission monitoring to identify specific revoked permission and call appropriate handler
- Created comprehensive test suite covering all permission revocation scenarios
- Modified emergency data callback to support custom reasons for each permission type

### File List

- apps/mobile/services/location-foreground-service-notifee.ts (added notification and camera permission handlers, updated monitoring logic)
- apps/mobile/store/attendance-store.ts (added permission check before check-in, imported permissionService)
- apps/mobile/services/__tests__/location-foreground-service-notifee.test.ts (added comprehensive permission revocation tests)