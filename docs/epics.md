---
stepsCompleted: [1]
inputDocuments: ['docs/prd.md', 'docs/architecture.md']
workflowType: 'epics-and-stories'
lastStep: 0
project_name: 'pgn'
user_name: 'Marshal'
date: '2025-12-07'
---

# Epics and User Stories - Enhanced Location Tracking Service

**Author:** Marshal
**Date:** 2025-12-07
**Version:** 1.0

## Context Validation

**Documents Analyzed:**
- ✅ PRD.md: 41 functional requirements across location tracking, emergency handling, and admin monitoring
- ✅ Architecture.md: Technical decisions for Notifee integration, service boundaries, and implementation patterns
- ❌ UX Design.md: Not available (enhancement project with existing UI patterns)

**Project Context:**
Enhancement of existing React Native + Next.js monorepo to add bulletproof location tracking using Notifee foreground services with intelligent emergency recovery.

## Functional Requirement Inventory

**Location Tracking Service Management (5 requirements):**
- FR1: Field Employee can start location tracking when checking in for work
- FR2: Field Employee can stop location tracking when checking out from work
- FR3: System can maintain continuous location tracking regardless of app state
- FR4: System can collect location data at 5-minute intervals during active tracking
- FR5: System can display persistent notification while tracking is active

**Emergency Scenario Handling (7 requirements):**
- FR6: System can perform automatic emergency check-out when battery reaches 5%
- FR7: System can perform automatic emergency check-out when location permission is revoked
- FR8: System can perform automatic emergency check-out when notification permission is revoked
- FR9: System can perform automatic emergency check-out when camera permission is revoked
- FR10: System can continue tracking during internet disconnections for up to 1 hour
- FR11: System can perform emergency check-out after 1 hour of offline time
- FR12: System can perform emergency check-out when service is interrupted by device restart

**Data Management & Persistence (5 requirements):**
- FR13: System can store last known location data locally for emergency recovery
- FR14: System can overwrite emergency data every 5 minutes with latest location
- FR15: System can store battery level with location data for audit purposes
- FR16: System can sync location data to server when internet connection is available
- FR17: System can clear emergency data after successful check-out completion

**Service Recovery & Health (4 requirements):**
- FR18: System can detect when service should be running on app startup
- FR19: System can resume tracking after app crashes within 15 minutes
- FR20: System can check permission status every 30 seconds during active tracking
- FR21: System can restart location tracking after app restart with valid emergency data

**Admin Monitoring & Visualization (5 requirements):**
- FR22: Admin can view real-time map of all active employees
- FR23: Admin can view complete location paths for employee work sessions
- FR24: Admin can see emergency check-out indicators with specific reasons
- FR25: Admin can access historical attendance data with location paths
- FR26: Admin can distinguish between normal check-outs and emergency check-outs

**Attendance & Audit Management (5 requirements):**
- FR27: System can record check-in timestamps with location coordinates
- FR28: System can record check-out timestamps with location coordinates
- FR29: System can maintain complete audit trail for compliance purposes
- FR30: HR can access attendance reports with emergency scenario indicators
- FR31: System can provide defensible documentation for labor inspections

**Device & Platform Integration (5 requirements):**
- FR32: System can request and manage Android location permissions
- FR33: System can request and manage Android camera permissions
- FR34: System can request and manage Android notification permissions
- FR35: System can function across different Android device manufacturers
- FR36: System can handle manufacturer-specific battery optimization behaviors

**User Experience & Communication (5 requirements):**
- FR37: Field Employee can see clear notifications about tracking status
- FR38: Field Employee can receive notifications about emergency check-outs
- FR39: System can provide different notification types for different scenarios
- FR40: IT Support can view technical diagnostics for troubleshooting
- FR41: System can provide clear explanations for tracking interruptions

━━━━━━━━━━━━━━━━━━━━━━━

## Epic Structure Plan

**Epic Design Principles:**
1. User-value focused - each epic delivers tangible business outcomes
2. Leverages existing architecture - builds upon current monorepo structure
3. Incremental delivery - each epic independently valuable
4. Logical dependencies - natural flow from foundation to advanced features

**Proposed Epic Structure:**

### Epic 1: Service Foundation & Emergency Data Persistence
**User Value:** Field employees can check in with confidence that their location data is continuously tracked and safely stored, even during app crashes or device restarts.

**PRD Coverage:** FR1, FR2, FR3, FR4, FR5, FR13, FR14, FR15, FR17, FR18
**Technical Context:**
- Uses existing attendance-store.ts structure
- Implements AsyncStorage with 'emergency_attendance_data' key
- Leverages Notifee foreground service decisions
- Follows established Zustand patterns

### Epic 2: Intelligent Emergency Scenario Handling
**User Value:** Field employees experience automatic safety nets during critical situations (low battery, permission issues, internet loss) with proper emergency check-outs that protect both employee and company interests.

**PRD Coverage:** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR16, FR19, FR20, FR21
**Technical Context:**
- Builds on Epic 1's emergency data structure
- Implements 30-second permission monitoring from architecture
- Uses existing battery monitoring patterns
- Integrates with permission service

### Epic 3: Admin Dashboard Enhancement & Monitoring
**User Value:** Operations managers can monitor field team in real-time, distinguish between normal and emergency check-outs, and access complete audit trails for compliance and dispute resolution.

**PRD Coverage:** FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR40, FR41
**Technical Context:**
- Enhances existing TrackingView.tsx component
- Uses attendance.service.ts for data access
- Integrates with existing API route patterns
- Leverages current dashboard structure

### Epic 4: Cross-Device Compatibility & Reliability
**User Value:** IT support can ensure reliable operation across all Android devices in the field, with proper handling of manufacturer-specific battery optimizations and comprehensive diagnostics.

**PRD Coverage:** FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39
**Technical Context:**
- Extends existing permission service
- Implements device-specific handling patterns
- Uses established notification patterns from Notifee
- Follows existing error handling utilities

━━━━━━━━━━━━━━━━━━━━━━━

## Epic 1: Service Foundation & Emergency Data Persistence

**Epic Goal:** Establish bulletproof location tracking service that persists through app state changes and stores emergency data for recovery scenarios.

### Story 1.1: Enhanced Emergency Data Storage Structure
**User Story:** As a field employee, I want my location data to be continuously saved during my work shift, So that if something happens to the app or device, my work activity is still recorded.

**Acceptance Criteria:**

Given I have checked in for work
When the location tracking service starts
Then the system creates an emergency data record in AsyncStorage with key 'emergency_attendance_data'
And the record contains: attendanceId, employeeId, employeeName, trackingActive: true, lastKnownTime: current timestamp

Given the location service is running
When 30 seconds pass (location tracking interval from architecture)
Then the system overwrites the emergency data with latest location
And location data includes: timestamp, coordinates [latitude, longitude], batteryLevel, accuracy if available
And lastStoredTime is updated to current timestamp
And consecutiveFailures is tracked (starting at 0)

**Technical Implementation:**
- Use AsyncStorage from existing apps/mobile/services/location-foreground-service-notifee.ts
- Follow EmergencyAttendanceData interface from packages/shared/src/types/
- Store as JSON string to preserve data structure
- Implement overwrite strategy (not append) per architecture decisions

**Prerequisites:** None

### Story 1.2: Notifee Foreground Service with Persistent Tracking
**User Story:** As a field employee, I want location tracking to continue even when I close the app or switch to other applications, So that I can focus on my work without worrying about the app.

**Acceptance Criteria:**

Given I am an active field employee
When I check in for work
Then the system creates a Notifee foreground service
And the service type is LOCATION + MEDIA_PLAYBACK (per architecture)
And the service displays a persistent notification showing "Location tracking active"

Given the service is running
When the app goes to background or is closed
Then the service continues operating
And location data is collected every 5 minutes
And emergency data is overwritten every 30 seconds

Given the service is running
When I check out normally
Then the foreground service is stopped
And emergency data is cleared from AsyncStorage
And the persistent notification is removed

**Technical Implementation:**
- Extend existing location-foreground-service-notifee.ts
- Use Notifee.createForegroundService() with LOCATION and MEDIA_PLAYBACK types
- Implement background location tracking using expo-location
- Follow existing notification patterns from architecture

**Prerequisites:** Story 1.1 complete

### Story 1.3: Service Health Monitoring & Restart Logic
**User Story:** As a field employee, I want the app to automatically resume tracking if it restarts during my work shift, So that I don't lose work hours due to technical issues.

**Acceptance Criteria:**

Given I have checked in for work
When I open the app (including after restart)
Then the attendance store initialization checks for active tracking
And if trackingActive: true in emergency data and lastStoredTime < 15 minutes ago
Then the location tracking service is automatically restarted

Given the app restarts while I was checked in
When more than 15 minutes have passed since lastStoredTime
Then the system performs emergency check-out
And attendance is marked with reason: "Service interrupted - device restart"
And emergency data is cleared

**Technical Implementation:**
- Modify apps/mobile/store/attendance-store.ts initialization
- Check emergency data on app start using AsyncStorage.getItem()
- Implement 15-minute threshold check (900000 ms)
- Use existing handleMobileApiResponse() for emergency check-out

**Prerequisites:** Stories 1.1 and 1.2 complete

### Story 1.4: Location Data Collection & Battery Logging
**User Story:** As a field employee, I want the system to track my location along with battery level, So that there is a complete audit trail of my work activity and device status.

**Acceptance Criteria:**

Given the location tracking service is active
When the 5-minute sync interval triggers
Then the system requests current GPS location
And accuracy must be < 100 meters for valid reading
And battery level is captured from expo-battery
And location data is structured as: timestamp, coordinates, batteryLevel, accuracy

Given a valid location is obtained
When internet connection is available
Then location data is sent to /api/attendance/location-sync endpoint
And emergency data is updated with latest location
And lastKnownTime is updated on successful sync

Given GPS accuracy is > 100 meters or location unavailable
When the sync interval triggers
Then emergency data is still updated with last known location
And consecutiveFailures counter is incremented
And system retries on next interval

**Technical Implementation:**
- Use expo-location for GPS data
- Use expo-battery for battery level monitoring
- Follow existing API client patterns from apps/mobile/services/api-client.ts
- Store battery level to prevent false battery claims (business requirement)

**Prerequisites:** Stories 1.1, 1.2, and 1.3 complete

### Story 1.5: Service State Management Integration
**User Story:** As a field employee, I want clear indication of whether tracking is active in the app, So that I know my work hours are being properly recorded.

**Acceptance Criteria:**

Given I open the attendance screen
When the component mounts
Then the attendance store reads tracking state from emergency data
And UI shows "Tracking Active" if trackingActive: true
And UI shows "Tracking Inactive" if no active tracking

Given I tap check-in button
When check-in is successful
Then tracking state is updated to active
And LocationSyncTimer component starts displaying countdown
 And emergency data is created/updated with trackingActive: true

Given I tap check-out button
When check-out is successful
Then tracking state is updated to inactive
And LocationSyncTimer stops displaying
And foreground service is stopped

**Technical Implementation:**
- Update apps/mobile/store/attendance-store.ts with tracking state
- Integrate with existing LocationSyncTimer.tsx component
- Use Zustand persist() middleware for state consistency
- Follow existing store patterns from architecture

**Prerequisites:** Stories 1.1, 1.2, 1.3, and 1.4 complete

**Epic 1 Complete: Service Foundation & Emergency Data Persistence**

Stories Created: 5

**FR Coverage:**
- FR1 ✓: Start tracking via check-in
- FR2 ✓: Stop tracking via check-out
- FR3 ✓: Continuous tracking regardless of app state
- FR4 ✓: 5-minute interval data collection
- FR5 ✓: Persistent notification
- FR13 ✓: Emergency data storage
- FR14 ✓: 5-minute overwrite (30-second for emergency)
- FR15 ✓: Battery level logging
- FR17 ✓: Emergency data clearing
- FR18 ✓: Service detection on app start

**Technical Context Used:**
- AsyncStorage emergency storage from architecture section "Data Architecture"
- Notifee service types from "Service Architecture"
- Zustand store patterns from "State Management Patterns"
- API response handling from "Error Handling Patterns"

━━━━━━━━━━━━━━━━━━━━━━━

## Epic 2: Intelligent Emergency Scenario Handling

**Epic Goal:** Implement comprehensive emergency detection and automatic check-outs for critical scenarios while maintaining data integrity and user communication.

### Story 2.1: Critical Battery Level Emergency Check-out
**User Story:** As a field employee, I want the app to automatically check me out when my battery is critically low, So that I don't lose my location data when my phone dies.

**Acceptance Criteria:**

Given location tracking service is active
When battery level drops to 5% or below
Then the system immediately performs emergency check-out
And check-out location is the last known GPS coordinates
And attendance record includes reason: "Emergency - Battery critical (5%)"
And a local notification is displayed: "Emergency check-out: Battery critically low"

Given battery reaches 5%
When emergency check-out is triggered
Then the foreground service is stopped
And emergency data is cleared from AsyncStorage
And tracking state is set to inactive
And the user is notified via app notification

**Technical Implementation:**
- Extend battery monitoring in location-foreground-service-notifee.ts
- Use expo-battery.addListener('batteryLevelChange')
- Implement immediate check-out logic when batteryLevel <= 0.05
- Use existing attendance store checkOut() method with emergency flag
- Follow Notifee notification patterns for emergency alerts

**Prerequisites:** Epic 1 complete

### Story 2.2: Permission Revocation Detection & Response
**User Story:** As a field employee, I want immediate notification if required permissions are revoked, So that I understand why tracking stopped and can fix the issue.

**Acceptance Criteria:**

Given location tracking is active
When location permission is changed from "Allow all the time" to any other setting
Then the system performs immediate emergency check-out
And attendance record includes reason: "Emergency - Location permission revoked"
And a notification explains: "Location tracking stopped due to permission change"

Given location tracking is active
When notification permission is revoked
Then the system performs emergency check-out
And attendance record includes reason: "Emergency - Notification permission revoked"
And the user cannot check in again until notification permission is restored

Given location tracking is active
When camera permission is revoked
Then the system performs emergency check-out
And attendance record includes reason: "Emergency - Camera permission revoked"
And future check-ins are blocked until camera permission is restored

**Technical Implementation:**
- Implement permission monitoring in apps/mobile/services/permissions.ts
- Use setInterval to check permissions every 30 seconds (per architecture)
- Use expo-location for location permission status
- Use expo-notifications for notification permission status
- Use expo-camera for camera permission status
- Compare current permissions with required permissions list

**Prerequisites:** Epic 1 complete

### Story 2.3: Internet Disconnection Handling with Grace Period
**User Story:** As a field employee, I want tracking to continue during temporary internet loss, So that I can work in areas with poor connectivity without losing my work hours.

**Acceptance Criteria:**

Given location tracking is active
When internet connection is lost
Then the system continues location tracking and storage
And emergency data is updated every 30 seconds with latest location
And offline timer starts counting from 0

Given internet is disconnected
When 1 hour (3600000 ms) of offline time elapses
Then the system performs emergency check-out
And attendance record includes reason: "Emergency - No internet for 1+ hours"
And last known location is used for check-out coordinates

Given internet connection is restored before 1 hour
When connectivity returns
Then the system resumes normal API sync immediately
And all stored emergency data is synced to server
And offline timer is reset to 0

**Technical Implementation:**
- Use NetInfo from @react-native-community/netinfo
- Track offlineStartTime when connection is lost
- Implement 1-hour timeout check in location service
- Queue failed sync attempts for later retry
- Use exponential backoff for retry attempts (3 attempts max)

**Prerequisites:** Epic 1 complete

### Story 2.4: App Crash Recovery & Service Death Detection
**User Story:** As a field employee, I want the app to detect if tracking stopped unexpectedly, So that my attendance is properly handled even if the app crashes.

**Acceptance Criteria:**

Given I had active tracking when app crashed
When I reopen the app
Then attendance store initialization checks lastStoredTime
And if (current time - lastStoredTime) > 15 minutes
Then emergency check-out is performed
And reason is: "Emergency - App crash or service interruption"
And last known location from emergency data is used

Given service died but app restarts within 15 minutes
When I open the app
Then tracking service is automatically restarted
And emergency data shows trackingActive: true
And normal location collection resumes
And user sees "Tracking resumed after interruption" notification

**Technical Implementation:**
- Modify attendance store initialization logic
- Calculate time difference: Date.now() - lastStoredTime
- Implement 15-minute threshold (900000 ms) for service death
- Use emergency data structure to determine last known state
- Integrate with existing error handling utilities

**Prerequisites:** Epic 1 complete

### Story 2.5: Comprehensive Permission Monitoring Service
**User Story:** As a field employee, I want the app to continuously verify that all required permissions are available, So that I'm immediately aware of any issues that might affect tracking.

**Acceptance Criteria:**

Given I am logged into the app
When I open the app
Then permission service checks all required permissions
And results are displayed: Location, Camera, Notifications
And any missing permissions are highlighted in red

Given I am actively tracking
When 30 seconds pass (monitoring interval)
Then permission service runs background check
And status is logged for debugging
And no user notification (to avoid annoyance)

Given a permission check fails
When monitoring detects the change
Then emergency check-out is triggered immediately
And specific permission that caused issue is recorded
And user receives clear notification about which permission to fix

**Technical Implementation:**
- Create PermissionMonitorService in apps/mobile/services/
- Implement checkAllPermissions() method
- Use expo-permissions for each required permission
- Store permission status in state for UI display
- Integrate with location service for background monitoring

**Prerequisites:** Stories 2.1, 2.2, 2.3, and 2.4 complete

### Story 2.6: Emergency Data Sync Recovery
**User Story:** As a field employee, I want any location data collected during connectivity issues to be automatically synced when internet returns, So that my complete work path is recorded.

**Acceptance Criteria:**

Given I had emergency data stored during offline period
When internet connection is restored
Then the system attempts to sync all stored data
And location data is sent to /api/attendance/emergency-sync endpoint
And server validates and stores the data with proper timestamps

Given sync is successful
When data is accepted by server
Then emergency data is cleared from AsyncStorage
And tracking continues normally
And consecutiveFailures counter is reset to 0

Given sync fails after 3 attempts
When all retry attempts are exhausted
Then emergency data is kept for manual sync
And user is notified of sync issues
And IT support can access stored emergency data via diagnostics

**Technical Implementation:**
- Implement EmergencySyncService
- Use existing API client with retry logic
- Add /api/attendance/emergency-sync endpoint on server
- Implement exponential backoff: 1s, 3s, 9s intervals
- Use transformApiErrorMessage() for error handling

**Prerequisites:** Stories 2.1, 2.2, 2.3, 2.4, and 2.5 complete

**Epic 2 Complete: Intelligent Emergency Scenario Handling**

Stories Created: 6

**FR Coverage:**
- FR6 ✓: Battery at 5% emergency check-out
- FR7 ✓: Location permission revocation
- FR8 ✓: Notification permission revocation
- FR9 ✓: Camera permission revocation
- FR10 ✓: Internet disconnection handling
- FR11 ✓: 1-hour offline timeout
- FR12 ✓: Service interruption detection
- FR16 ✓: Sync when internet available
- FR19 ✓: Resume after app crash < 15 min
- FR20 ✓: 30-second permission monitoring
- FR21 ✓: Restart after app restart

**Technical Context Used:**
- Permission monitoring patterns from architecture "Permission Monitoring Strategy"
- Emergency data structure from "Data Architecture"
- API retry patterns from "Integration" section
- Notification patterns from Notifee implementation

━━━━━━━━━━━━━━━━━━━━━━━

## Epic 3: Admin Dashboard Enhancement & Monitoring

**Epic Goal:** Provide operations management with real-time visibility into field operations and comprehensive tools for audit trail verification and emergency scenario analysis.

### Story 3.1: Real-time Employee Location Map
**User Story:** As an operations manager, I want to see all field employees' real-time locations on a map, So that I can monitor team coverage and respond quickly to any issues.

**Acceptance Criteria:**

Given I am logged in as admin/operations manager
When I open the dashboard
Then I see a map view with all active employees displayed
And each employee is shown as a colored dot on the map
And dots refresh every 30 seconds (per performance requirements)
And hovering over a dot shows employee name and last update time

Given the map is displayed
When I click on an employee dot
Then an info panel shows: employee name, check-in time, last location
And the employee's path history is highlighted on the map
And emergency indicators are shown if applicable

Given no employees are currently active
When I view the map
Then the map shows appropriate "No active tracking" message
And I can still view historical data from previous shifts

**Technical Implementation:**
- Enhance apps/web/app/(dashboard)/dashboard/components/TrackingView.tsx
- Use existing map library (specified in architecture)
- Implement polling every 30 seconds for real-time updates
- Use existing employee service to get active tracking data
- Follow existing React component patterns with shadcn/ui

**Prerequisites:** Epic 2 complete (for emergency data structure)

### Story 3.2: Complete Location Path Visualization
**User Story:** As an operations manager, I want to see complete location paths for employee work sessions, So that I can verify field coverage and productivity.

**Acceptance Criteria:**

Given I select an employee from the list
When I click "View Path" button
Then the map displays the complete location path for their shift
And path is shown as a colored line connecting all location points
And time markers show significant location updates
And battery levels are displayed at key points

Given a path is displayed
When I hover over path segments
Then I see timestamp and location details for that point
And battery level at that time is displayed
And any gaps in tracking are highlighted

Given emergency check-outs occurred
When viewing the path
Then emergency locations are marked with special icons
And clicking the icon shows emergency reason
And the path clearly shows where tracking ended

**Technical Implementation:**
- Extend TrackingView component with path rendering
- Use daily_attendance table location_path JSONB data
- Implement path smoothing for better visualization
- Add battery level overlays on path visualization
- Use existing color assignment system for employee paths

**Prerequisites:** Story 3.1 complete

### Story 3.3: Emergency Check-out Indicators & Analysis
**User Story:** As an operations manager, I want to clearly distinguish between normal and emergency check-outs, So that I can quickly identify and investigate issues.

**Acceptance Criteria:**

Given I view the employee list
When emergency check-outs exist
Then affected employees are highlighted with red indicator
And emergency count badge shows on employee row
And hovering shows "X emergency check-outs" tooltip

Given I click on emergency indicator
When the detail modal opens
Then I see list of all emergency events for that employee
And each event shows: date, time, reason, location
And I can view the exact location on map
And I can add notes for investigation follow-up

Given I run attendance reports
When generating reports for a period
Then the report includes emergency check-out statistics
And separate columns for normal vs emergency check-outs
And summary shows emergency rate per employee

**Technical Implementation:**
- Update apps/web/app/(dashboard)/dashboard/components/EmployeeList.tsx
- Add emergency indicator badges
- Create EmergencyCheckoutModal component
- Extend attendance service to filter emergency records
- Use existing modal patterns from components directory

**Prerequisites:** Story 3.1 complete

### Story 3.4: Historical Attendance Data with Location Paths
**User Story:** As an HR manager, I want to access complete historical attendance with location paths, So that I can handle disputes and provide documentation for compliance.

**Acceptance Criteria:**

Given I need historical attendance data
When I use date range filter on dashboard
Then I can view any past date's attendance records
And each record shows check-in/out times with locations
And location paths are viewable for any past date

Given I select a historical record
When I click "View Details"
Then complete attendance information is displayed
Including all location points, battery levels, and any emergency events
And data is available for all past years (7+ year retention)

Given compliance audit is required
When I export attendance data
Then exported data includes complete location paths
And emergency reasons and timestamps are included
And data format meets compliance requirements

**Technical Implementation:**
- Extend attendance service for historical data queries
- Implement date range filtering in dashboard
- Create export functionality for compliance
- Use existing Supabase queries with proper date filtering
- Follow existing data export patterns

**Prerequisites:** Story 3.1 and 3.3 complete

### Story 3.5: Technical Diagnostics for IT Support
**User Story:** As an IT support engineer, I want to access technical diagnostics for tracking issues, So that I can troubleshoot problems effectively and provide clear explanations.

**Acceptance Criteria:**

Given an employee reports tracking issues
When I access employee diagnostics
Then I see complete technical log: service start/stop times, permission changes, battery levels
And last known location with accuracy and timestamp
And consecutive failure counts for API sync
And emergency data snapshots if available

Given troubleshooting is needed
When I view diagnostics
Then I can see device-specific information
And network connectivity logs
And any error messages from the app
And recommendations for fixing common issues

Given multiple employees have similar issues
When I analyze patterns
Then I can identify if issue is device-specific, location-specific, or systemic
And I can see frequency of each emergency type
And I can filter by emergency reason for trend analysis

**Technical Implementation:**
- Create TechnicalDiagnostics component
- Add /api/attendance/diagnostics endpoint
- Store diagnostic data in database for analysis
- Use existing error handling patterns
- Implement diagnostic data visualization

**Prerequisites:** Story 3.1 complete

### Story 3.6: Enhanced API Endpoints for Location Data
**User Story:** As the system, I need dedicated API endpoints for location tracking data, So that the dashboard can efficiently retrieve and display tracking information.

**Acceptance Criteria:**

Given dashboard needs real-time data
When requesting active employees
Then GET /api/attendance?status=CHECKED_IN returns list of currently tracking employees
And each includes last location, check-in time, battery level from existing data
And response is optimized for 30-second polling

Given dashboard needs historical paths
When requesting location history
Then /api/attendance/locations/{employeeId}/{date} returns complete path
And data includes timestamps, coordinates, battery levels
And path is ordered chronologically for proper rendering

Given emergency data is needed
When requesting emergency records
Then /api/attendance/emergencies returns all emergency check-outs
And each includes reason, location, timestamp, employee info
And data can be filtered by date range or employee

**Technical Implementation:**
- Enhance existing /api/attendance route to return active employees list
- Extend attendanceService with getActiveEmployees() method
- Use existing /api/attendance/[id]/location-update for location sync
- Add new /api/attendance/[id]/locations endpoint for historical paths
- Create /api/attendance/emergencies endpoint for emergency records
- Use existing JWT middleware and error handling patterns

**Prerequisites:** None (can be parallel with other Epic 3 stories)

**Epic 3 Complete: Admin Dashboard Enhancement & Monitoring**

Stories Created: 6

**FR Coverage:**
- FR22 ✓: Real-time map of active employees
- FR23 ✓: Complete location path visualization
- FR24 ✓: Emergency check-out indicators with reasons
- FR25 ✓: Historical attendance data with paths
- FR26 ✓: Distinguish normal vs emergency check-outs
- FR27 ✓: Check-in timestamps with coordinates
- FR28 ✓: Check-out timestamps with coordinates
- FR29 ✓: Complete audit trail for compliance
- FR30 ✓: HR attendance reports with emergency indicators
- FR31 ✓: Defensible documentation for labor inspections
- FR40 ✓: Technical diagnostics for troubleshooting
- FR41 ✓: Clear explanations for tracking interruptions

**Technical Context Used:**
- Existing dashboard component structure from architecture
- Service layer patterns for API access
- JWT middleware for security
- Error handling utilities from utils/errorHandling.ts
- Database access patterns via Supabase service layer

━━━━━━━━━━━━━━━━━━━━━━━

## Epic 4: Cross-Device Compatibility & Reliability

**Epic Goal:** Ensure robust operation across all Android device manufacturers with proper handling of battery optimization behaviors and comprehensive permission management.

### Story 4.1: Android Manufacturer Compatibility Detection
**User Story:** As a field employee, I want the app to automatically detect and configure for my specific Android device manufacturer, So that tracking works reliably regardless of which Android device I use.

**Acceptance Criteria:**

Given I install the app on any Android device
When I first open the app
Then the device manufacturer is detected
And specific configuration is applied based on manufacturer
And any manufacturer-specific requirements are handled

Given I have a Samsung device
When the app starts
Then Samsung-specific battery optimization settings are handled
And proper service types are used for Samsung devices
And any Samsung-specific permissions are requested

Given I have a Xiaomi/Redmi device
When the app starts
Then MIUI optimization settings are detected
And user is guided through MIUI-specific setup
And background service permissions are properly configured

**Technical Implementation:**
- Use expo-device to get manufacturer information
- Create manufacturer-specific configuration objects
- Implement DeviceCompatibilityService
- Handle known manufacturer-specific behaviors:
  - Samsung: Different battery optimization APIs
  - Xiaomi: MIUI autostart permissions
  - OnePlus: Battery optimization exceptions
  - Huawei: Protected apps whitelist

**Prerequisites:** Epic 1 complete

### Story 4.2: Battery Optimization Whitelist Management
**User Story:** As a field employee, I want clear guidance on how to prevent the system from killing tracking service, So that I can ensure continuous operation without technical issues.

**Acceptance Criteria:**

Given I check in for the first time
When location tracking starts
Then battery optimization check is performed
And if app is not whitelisted, user is guided to settings
And step-by-step instructions are shown for their specific device

Given battery settings block the app
When user returns from settings
Then battery whitelist status is rechecked
And if still not whitelisted, user cannot start tracking
And clear explanation is provided about why this is required

Given app is properly whitelisted
When user tries to check in
Then tracking can start normally
And battery optimization warning is not shown
And service operates reliably in background

**Technical Implementation:**
- Use React Native's Linking API to open device settings
- Detect battery optimization status via expo-battery
- Create device-specific instruction screens
- Store whitelist status in app state
- Check whitelist status before allowing tracking

**Prerequisites:** Story 4.1 complete

### Story 4.3: Comprehensive Permission Flow Management
**User Story:** As a field employee, I want a clear, guided process for granting all required permissions, So that I understand exactly what is needed and why.

**Acceptance Criteria:**

Given I am a new user
When I first open the app
Then a permission flow screens shows all required permissions
And each permission explains why it's needed in simple terms
And I can grant permissions one by one with clear instructions

Given I deny a critical permission
When I try to check in
Then the app explains which permission is missing
And I'm guided to settings to grant the permission
And check-in is blocked until all required permissions are granted

Given permissions are granted
When I use the app
Then permission status is periodically checked in background
And any permission revocation is immediately detected
And user is notified if permissions are revoked during use

**Technical Implementation:**
- Create PermissionFlow component with step-by-step screens
- Use expo-permissions for each permission type
- Implement permission status monitoring service
- Create permission request utilities
- Integrate with existing permissions.ts service

**Prerequisites:** Epic 2 complete (for permission monitoring)

### Story 4.4: Advanced Notification System for Critical Events
**User Story:** As a field employee, I want clear, non-intrusive notifications about tracking status, So that I stay informed without being annoyed by unnecessary alerts.

**Acceptance Criteria:**

Given tracking is active
When normal operation continues
Then only subtle notification shows tracking is active
And no additional notifications for regular syncs
And battery percentage is shown in notification

Given emergency check-out occurs
When any emergency scenario triggers
Then a prominent notification is displayed
And notification clearly explains what happened
And user can tap to see details and take action

Given permission issues occur
When monitoring detects problems
Then user receives helpful notification explaining issue
And notification includes direct link to fix the problem
And repeated notifications are avoided (smart frequency control)

**Technical Implementation:**
- Enhance Notifee notification implementation
- Create different notification channels for different types:
  - Active tracking: Low priority, persistent
  - Emergency: High priority, alert
  - Permission issues: Medium priority, actionable
- Implement smart notification frequency control
- Use notification styles appropriate for each type

**Prerequisites:** Epic 2 complete (for emergency detection)

### Story 4.5: Device Performance Monitoring & Optimization
**User Story:** As a field employee, I want the app to optimize battery usage while maintaining tracking accuracy, So that I can work a full shift without excessive battery drain.

**Acceptance Criteria:**

Given tracking is active for extended periods
When monitoring battery usage
Then average battery consumption stays below 8% per 8-hour shift
And GPS accuracy is maintained at acceptable levels
And service operates efficiently across different device types

Given device is under heavy load
When system resources are limited
Then tracking service adapts to maintain operation
And location accuracy is balanced with battery usage
And emergency data is always preserved

Given battery optimization is aggressive
When device manufacturer limits background services
Then app detects and adapts behavior
And alternative notification methods are used if needed
And user is informed of any limitations

**Technical Implementation:**
- Monitor battery usage patterns
- Implement adaptive GPS accuracy based on battery level
- Create device performance profiles
- Optimize service intervals based on device capabilities
- Use background task scheduling efficiently

**Prerequisites:** Epic 1 and Epic 2 complete

### Story 4.6: Device-Specific Troubleshooting Guides
**User Story:** As an IT support engineer, I want access to device-specific troubleshooting guides, So that I can quickly resolve issues for employees using different Android devices.

**Acceptance Criteria:**

Given an employee reports issues
When I access troubleshooting section
Then I can search by device manufacturer and model
And step-by-step guides are provided for common issues
And guides include screenshots for specific device settings

Given new device models emerge
When updated information is available
Then troubleshooting guides are updated
And support team is notified of new requirements
And guides cover both setup and ongoing operation

Given recurring issues are identified
When analyzing support tickets
Then common solutions are documented
And guides are updated with most effective solutions
And preventive measures are recommended

**Technical Implementation:**
- Create TroubleshootingGuide component
- Store device-specific guides in database
- Implement guide search and filtering
- Create guide update workflow for support team
- Track guide effectiveness and user feedback

**Prerequisites:** Story 4.1, 4.2, and 4.3 complete

**Epic 4 Complete: Cross-Device Compatibility & Reliability**

Stories Created: 6

**FR Coverage:**
- FR32 ✓: Android location permissions management
- FR33 ✓: Android camera permissions management
- FR34 ✓: Android notification permissions management
- FR35 ✓: Function across different Android manufacturers
- FR36 ✓: Handle manufacturer-specific battery optimizations
- FR37 ✓: Clear notifications about tracking status
- FR38 ✓: Notifications about emergency check-outs
- FR39 ✓: Different notification types for different scenarios

**Technical Context Used:**
- Device detection patterns from architecture "Device & Platform Integration"
- Permission management from existing permissions.ts
- Notifee implementation patterns for notifications
- Battery optimization handling strategies
- Error handling utilities for device-specific issues

━━━━━━━━━━━━━━━━━━━━━━━

## FR Coverage Matrix

| FR | Description | Epic | Story | Implementation Details |
|----|-------------|------|-------|------------------------|
| FR1 | Start location tracking when checking in | Epic 1 | 1.2 | Notifee foreground service starts on check-in |
| FR2 | Stop location tracking when checking out | Epic 1 | 1.2 | Service stopped on normal check-out |
| FR3 | Maintain continuous tracking regardless of app state | Epic 1 | 1.2 | Foreground service persists through app state changes |
| FR4 | Collect location data at 5-minute intervals | Epic 1 | 1.4 | GPS location captured every 5 minutes |
| FR5 | Display persistent notification while tracking | Epic 1 | 1.2 | Notifee notification shows tracking status |
| FR6 | Emergency check-out when battery reaches 5% | Epic 2 | 2.1 | Battery monitoring triggers check-out at 5% |
| FR7 | Emergency check-out when location permission revoked | Epic 2 | 2.2 | Permission monitoring detects revocation |
| FR8 | Emergency check-out when notification permission revoked | Epic 2 | 2.2 | Permission monitoring handles notification permission |
| FR9 | Emergency check-out when camera permission revoked | Epic 2 | 2.2 | Permission monitoring handles camera permission |
| FR10 | Continue tracking during internet disconnections | Epic 2 | 2.3 | Offline mode continues for 1 hour |
| FR11 | Emergency check-out after 1 hour offline | Epic 2 | 2.3 | 1-hour timeout triggers emergency check-out |
| FR12 | Emergency check-out when service interrupted by restart | Epic 1 | 1.3 | Service death detection on app restart |
| FR13 | Store last known location data locally | Epic 1 | 1.1 | AsyncStorage emergency data structure |
| FR14 | Overwrite emergency data every 5 minutes | Epic 1 | 1.1 | Emergency data updated every 30 seconds |
| FR15 | Store battery level with location data | Epic 1 | 1.4 | Battery level captured with each location |
| FR16 | Sync location data when internet available | Epic 2 | 2.6 | Emergency data sync on connection restore |
| FR17 | Clear emergency data after check-out | Epic 1 | 1.2 | AsyncStorage cleared on successful check-out |
| FR18 | Detect when service should be running on app start | Epic 1 | 1.3 | Attendance store checks emergency data on start |
| FR19 | Resume tracking after app crashes within 15 minutes | Epic 2 | 2.4 | 15-minute threshold for service recovery |
| FR20 | Check permission status every 30 seconds | Epic 2 | 2.5 | Background permission monitoring service |
| FR21 | Restart location tracking after app restart | Epic 1 | 1.3 | Service restart logic in attendance store |
| FR22 | Admin can view real-time map of active employees | Epic 3 | 3.1 | TrackingView shows live employee locations |
| FR23 | Admin can view complete location paths | Epic 3 | 3.2 | Path visualization for employee sessions |
| FR24 | Admin can see emergency check-out indicators | Epic 3 | 3.3 | Emergency indicators in employee list |
| FR25 | Admin can access historical attendance data | Epic 3 | 3.4 | Date range filtering for historical data |
| FR26 | Admin can distinguish normal vs emergency check-outs | Epic 3 | 3.3 | Visual differentiation in dashboard |
| FR27 | Record check-in timestamps with location | Epic 3 | 3.6 | API stores check-in with coordinates |
| FR28 | Record check-out timestamps with location | Epic 3 | 3.6 | API stores check-out with coordinates |
| FR29 | Maintain complete audit trail for compliance | Epic 3 | 3.4 | 7+ year data retention in database |
| FR30 | HR can access attendance reports with emergency indicators | Epic 3 | 3.3 | Reports include emergency statistics |
| FR31 | Provide defensible documentation for inspections | Epic 3 | 3.4 | Export functionality for compliance |
| FR32 | Request and manage Android location permissions | Epic 4 | 4.3 | Permission flow handles location requests |
| FR33 | Request and manage Android camera permissions | Epic 4 | 4.3 | Permission flow handles camera requests |
| FR34 | Request and manage Android notification permissions | Epic 4 | 4.3 | Permission flow handles notification requests |
| FR35 | Function across different Android manufacturers | Epic 4 | 4.1 | Manufacturer detection and configuration |
| FR36 | Handle manufacturer-specific battery optimizations | Epic 4 | 4.2 | Battery whitelist management per manufacturer |
| FR37 | Field employee can see clear notifications about tracking | Epic 4 | 4.4 | Notification system with clear status |
| FR38 | Field employee can receive notifications about emergency check-outs | Epic 4 | 4.4 | Emergency notifications with clear explanations |
| FR39 | System can provide different notification types for scenarios | Epic 4 | 4.4 | Multiple notification channels for different types |
| FR40 | IT Support can view technical diagnostics | Epic 3 | 3.5 | Technical diagnostics component |
| FR41 | System can provide clear explanations for interruptions | Epic 3 | 3.5 | Detailed logs and explanations in diagnostics |

## Final Validation

✅ **Complete Epic and Story Creation**

**Output Generated:** docs/epics.md with comprehensive implementation details

**Full Context Incorporated:**
- ✅ PRD functional requirements and scope (41 FRs covered)
- ✅ Architecture technical decisions and contracts
- ❌ UX Design patterns (not available for this enhancement project)

**FR Coverage:** 41 functional requirements mapped to 23 stories across 4 epics
**Epic Structure:** 4 epics delivering incremental user value
  - Epic 1: Foundation (5 stories) - Core service reliability
  - Epic 2: Emergency Handling (6 stories) - Comprehensive safety nets
  - Epic 3: Admin Monitoring (6 stories) - Visibility and compliance
  - Epic 4: Device Compatibility (6 stories) - Cross-manufacturer support

**Ready for Phase 4:** Sprint Planning and Development Implementation