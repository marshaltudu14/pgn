# Story 2.3: Internet Disconnection Handling with Grace Period

Status: Ready for Review

## Story

As a field employee,
I want tracking to continue during temporary internet loss,
so that I can work in areas with poor connectivity without losing my work hours.

## Acceptance Criteria

1. Given location tracking is active, when internet connection is lost, then the system continues location tracking and storage
2. And emergency data is updated every 30 seconds with latest location (for recovery purposes)
3. And service continues collecting GPS data every 5 minutes (normal interval)
4. Given internet is disconnected while service is running, when 1 hour (3600000 ms) of offline time elapses, then the system performs emergency check-out
5. And attendance record includes reason: "Emergency - No internet for 1+ hours"
6. And last known location is used for check-out coordinates
7. Given app is reopened or service restarts, when we check lastStoredTime from emergency data, then we calculate elapsed time
8. And if elapsed time > 1 hour AND service was running (not crashed), then perform emergency check-out
9. And if elapsed time <= 1 hour OR service was crashed, then resume tracking if still CHECKED_IN
10. Given internet connection is restored before 1 hour, when connectivity returns, then the system resumes normal API sync immediately

## Tasks / Subtasks

- [x] Task 1: Implement Network Connectivity Monitoring (AC: 1, 7)
  - [x] Subtask 1.1: Import and initialize NetInfo from @react-native-community/netinfo
  - [x] Subtask 1.2: Add network state tracking to location service
  - [x] Subtask 1.3: Start monitoring connection changes when tracking begins
- [x] Task 2: Implement Offline Mode Data Storage (AC: 2, 3)
  - [x] Subtask 2.1: Track offlineStartTime when connection is lost
  - [x] Subtask 2.2: Continue emergency data updates during offline mode
  - [x] Subtask 2.3: Log offline duration for debugging
- [x] Task 3: Implement 1-Hour Offline Timeout Check (AC: 4, 5, 6)
  - [x] Subtask 3.1: Add offline timeout check in tracking loop
  - [x] Subtask 3.2: Calculate offline duration: Date.now() - offlineStartTime
  - [x] Subtask 3.3: Trigger emergency check-out when > 1 hour offline
  - [x] Subtask 3.4: Use last known location from emergency data for check-out
- [x] Task 4: Implement Sync Recovery on Reconnection (AC: 7, 8, 9)
  - [x] Subtask 4.1: Detect internet connection restoration
  - [x] Subtask 4.2: Reset offline timer to 0
  - [x] Subtask 4.3: Continue normal API sync immediately
  - [x] Subtask 4.4: Don't need special sync - normal location updates will handle it
- [x] Task 5: Add Network State to Service State
  - [x] Subtask 5.1: Extend LocationTrackingState interface with isOnline flag
  - [x] Subtask 5.2: Update state when connectivity changes
  - [x] Subtask 5.3: Expose network status via getState() method
- [x] Task 6: Write Tests for Internet Disconnection Handling
  - [x] Subtask 6.1: Unit tests for offline detection
  - [x] Subtask 6.2: Unit tests for 1-hour timeout
  - [x] Subtask 6.3: Unit tests for reconnection recovery

## Dev Notes

- Use @react-native-community/netinfo (already in package.json)
- Service continues GPS collection every 5 minutes regardless of internet status
- Emergency data updated every 30 seconds for recovery purposes (not for API sync)
- Key distinction: Service crash vs Internet outage
  - Service crash = always emergency check-out (Story 1.3)
  - Internet outage = 1-hour grace period if service still running
- Add wasOnline flag to EmergencyAttendanceData to detect crash vs outage
- Calculate elapsed time only on app restart/service recovery
- No special sync queue - normal 5-minute API calls resume when internet returns

### Project Structure Notes

- Modify apps/mobile/services/location-foreground-service-notifee.ts
  - Add NetInfo import and network monitoring
  - Add offlineStartTime tracking to state
  - Continue 5-minute location updates regardless of internet
- Modify packages/shared/src/types/attendance.ts
  - Add wasOnline flag to EmergencyAttendanceData interface
- Modify apps/mobile/store/attendance-store.ts
  - Update service health check to handle offline duration calculation
  - Distinguish between service crash vs internet outage scenarios

### References

- [Source: docs/architecture.md#Data Architecture] - "1-hour internet grace period"
- [Source: docs/epics.md#Epic 2] - Story 2.3 detailed requirements
- [Source: apps/mobile/package.json] - @react-native-community/netinfo@11.4.1 already installed

## Dev Agent Record

### Context Reference
- Used existing network monitoring infrastructure from `@/utils/network-check`
- Integrated with existing emergency data storage system
- Followed established patterns for location tracking service

### Agent Model Used
claude-3-5-sonnet-20241022

### Debug Log References
- Network change events logged with status updates
- Offline timeout check runs every minute
- Emergency check-out triggered after 1 hour offline

### Completion Notes List
- Successfully implemented all acceptance criteria for internet disconnection handling
- Added network state tracking to location service with isOnline flag and offlineStartTime
- Implemented 1-hour offline grace period with automatic emergency check-out
- Service continues GPS collection every 5 minutes regardless of internet status
- Emergency data updated every 30 seconds with latest location for recovery
- Added comprehensive test coverage for all internet disconnection scenarios
- Distinguished between service crash and internet outage scenarios using wasOnline flag

### File List
- apps/mobile/services/location-foreground-service-notifee.ts (main implementation)
- apps/mobile/services/__tests__/location-foreground-service-notifee.test.ts (tests added)
- apps/mobile/store/attendance-store.ts (updated for offline duration calculation)
- packages/shared/src/types/attendance.ts (added wasOnline and offlineStartTime fields)