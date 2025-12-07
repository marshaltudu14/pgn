---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
inputDocuments: []
workflowType: 'prd'
lastStep: 11
project_name: 'pgn'
user_name: 'Marshal'
date: '2025-12-07'
---

# Product Requirements Document - Enhanced Location Tracking Service

**Author:** Marshal
**Date:** 2025-12-07
**Version:** 1.0

## Executive Summary

The PGN Location Tracking Service Enhancement delivers bulletproof reliability for field employee monitoring through intelligent service persistence and graceful failure recovery. By leveraging Notifee's foreground service capabilities combined with smart emergency recovery logic, we ensure continuous location tracking regardless of app state or environmental conditions.

### What Makes This Special

Unlike traditional tracking solutions that fail silently or require constant user attention, this system operates invisibly in the background. The key innovation lies in its simplicity: store the last known location locally, overwrite it every 5 minutes, and only perform emergency check-out when the service truly cannot continue. This approach eliminates complex offline queuing while maintaining complete audit trails. The 1-hour internet grace period acknowledges real-world field conditions where legitimate connectivity gaps exist, distinguishing between service failure and network unavailability.

## Project Classification

**Technical Type:** mobile_app
**Domain:** general
**Complexity:** medium

This React Native mobile application enhancement focuses on Android-only deployment with location services integration. The medium complexity stems from managing service lifecycle, handling multiple failure scenarios, and ensuring data integrity across device states. The project leverages existing infrastructure (Notifee, Supabase, AsyncStorage) while introducing intelligent recovery mechanisms that significantly improve reliability without architectural overhauls.

## 1. Business Requirements

## 2. Problem Statement

The current location tracking service needs refinement to handle edge cases including:
- Internet disconnections
- App crashes and force kills
- Phone restarts
- Permission revocations
- Battery drain scenarios
- Service failures

## 3. Business Requirements

### 3.1 Core Business Objectives
- Provide continuous location tracking for field employees
- Maintain audit trail for compliance (7+ year retention)
- Handle all failure scenarios gracefully
- Keep implementation simple and maintainable

### 3.2 Key Business Rules
- Location tracking only for field monitoring (not payroll calculation)
- 5-minute sync intervals to server
- Emergency recovery when service cannot continue
- Battery level logged to database (prevents false battery claims)

### 3.3 Success Metrics
- 0 tracking gaps during employee work hours
- 100% emergency check-outs with valid location data
- < 5 minutes recovery time from app crashes

## Success Criteria

### User Success
- Field employee checks in once and app handles ALL scenarios automatically
- No need for employee to restart app or handle errors
- Clear notifications only when absolutely necessary (battery 5%, permission revoked)

### Business Success
- Admin sees complete location paths for ALL work hours
- Emergency check-outs show exact last location and reason
- Zero "I was working but app failed" excuses from employees

### Technical Success
- Service runs continuously from check-in to check-out
- Every 5 minutes: location data sent to server OR stored locally
- Emergency data ALWAYS saved (overwrite previous)
- Recovery logic handles ALL restart scenarios

### Measurable Outcomes
- 0 tracking gaps during employee work hours
- 100% emergency check-outs with valid location data
- < 5 minutes recovery time from app crashes

## Product Scope

### MVP - What MUST work
1. **Service Persistence**
   - Notifee foreground service continues after app close
   - 5-minute sync interval
   - Emergency data stored every sync

2. **Emergency Scenarios**
   - Battery at 5% → check-out with location
   - Any permission revoked → check-out with location
   - App restart → check-out if >15 minutes since last sync

3. **Internet Handling**
   - No internet → keep storing locally
   - Internet back → resume normal sync
   - 1-hour offline grace ONLY if service still running

### Growth Features (Phase 2)
- App crash detection (if service dead but app closed normally)
- Service health monitoring
- Better admin notifications for different emergency types

### Vision (Future)
- Basic pattern detection (repeated "issues" with same employee)
- Improved admin dashboard for emergency review

## 4. Functional Requirements

### Location Tracking Service Management

- FR1: Field Employee can start location tracking when checking in for work
- FR2: Field Employee can stop location tracking when checking out from work
- FR3: System can maintain continuous location tracking regardless of app state
- FR4: System can collect location data at 5-minute intervals during active tracking
- FR5: System can display persistent notification while tracking is active

### Emergency Scenario Handling

- FR6: System can perform automatic emergency check-out when battery reaches 5%
- FR7: System can perform automatic emergency check-out when location permission is revoked
- FR8: System can perform automatic emergency check-out when notification permission is revoked
- FR9: System can perform automatic emergency check-out when camera permission is revoked
- FR10: System can continue tracking during internet disconnections for up to 1 hour
- FR11: System can perform emergency check-out after 1 hour of offline time
- FR12: System can perform emergency check-out when service is interrupted by device restart

### Data Management & Persistence

- FR13: System can store last known location data locally for emergency recovery
- FR14: System can overwrite emergency data every 5 minutes with latest location
- FR15: System can store battery level with location data for audit purposes
- FR16: System can sync location data to server when internet connection is available
- FR17: System can clear emergency data after successful check-out completion

### Service Recovery & Health

- FR18: System can detect when service should be running on app startup
- FR19: System can resume tracking after app crashes within 15 minutes
- FR20: System can check permission status every 30 seconds during active tracking
- FR21: System can restart location tracking after app restart with valid emergency data

### Admin Monitoring & Visualization

- FR22: Admin can view real-time map of all active employees
- FR23: Admin can view complete location paths for employee work sessions
- FR24: Admin can see emergency check-out indicators with specific reasons
- FR25: Admin can access historical attendance data with location paths
- FR26: Admin can distinguish between normal check-outs and emergency check-outs

### Attendance & Audit Management

- FR27: System can record check-in timestamps with location coordinates
- FR28: System can record check-out timestamps with location coordinates
- FR29: System can maintain complete audit trail for compliance purposes
- FR30: HR can access attendance reports with emergency scenario indicators
- FR31: System can provide defensible documentation for labor inspections

### Device & Platform Integration

- FR32: System can request and manage Android location permissions
- FR33: System can request and manage Android camera permissions
- FR34: System can request and manage Android notification permissions
- FR35: System can function across different Android device manufacturers
- FR36: System can handle manufacturer-specific battery optimization behaviors

### User Experience & Communication

- FR37: Field Employee can see clear notifications about tracking status
- FR38: Field Employee can receive notifications about emergency check-outs
- FR39: System can provide different notification types for different scenarios
- FR40: IT Support can view technical diagnostics for troubleshooting
- FR41: System can provide clear explanations for tracking interruptions


## 5. Technical Requirements

### 5.1 Data Structure
```typescript
interface EmergencyData {
  attendanceId: string;
  employeeId: string;
  employeeName: string;
  lastLocationUpdate: {
    timestamp: number;
    coordinates: [number, number];
    batteryLevel: number;
    accuracy?: number;
  };
  trackingActive: boolean;
  lastKnownTime: number;     // Last successful API sync
  lastStoredTime: number;    // Last local storage update
  wasOnline: boolean;
  consecutiveFailures: number;
  reason?: string;
}
```

### 5.2 Implementation Components
- Enhanced emergency data storage (overwrite strategy)
- Service health monitoring
- Permission monitoring service
- Recovery logic on app start
- Clear user notifications

### 5.3 Platform Considerations
- Android-only deployment
- Notifee for foreground service management
- AsyncStorage for local emergency data
- Supabase for server-side storage

## 6. Non-Functional Requirements

### Performance

**Location Sync Performance:**
- Location data must sync to server within 10 seconds of 5-minute interval trigger
- Admin dashboard must reflect location updates within 30 seconds
- Emergency check-out notifications must display within 5 seconds of trigger

**Battery Impact:**
- Location tracking must not consume more than 8% battery per 8-hour shift
- App must operate efficiently on devices with 3000mAh+ battery capacity

### Security

**Data Protection:**
- All location data must be encrypted in transit (HTTPS/TLS)
- Location data must be encrypted at rest in database
- Emergency data stored locally must use device-level encryption

**Access Control:**
- API endpoints must require valid JWT authentication (15-minute expiration)
- Role-based access control for admin, HR, and IT support user types
- Employee data isolation - users can only access their own location data

### Reliability

**Service Uptime:**
- Foreground service must maintain 99.5%+ uptime during work hours
- Automatic recovery from service interruptions within 15 minutes
- Zero data loss during normal operation scenarios

**Failure Handling:**
- Graceful degradation during network disconnections
- Emergency data persistence across device restarts
- Clear audit trail for all failure scenarios

### Integration

**Backend Integration:**
- Supabase API calls must retry on failure (3 attempts with exponential backoff)
- Location data batch processing to handle multiple employees simultaneously
- Rate limiting to prevent API abuse (100 requests per minute per device)

### Usability

- Clear notifications explaining service status
- Easy recovery after legitimate interruptions
- Admin dashboard indicators for emergency check-outs

## 7. User Stories

### Epic 1: Robust Service Operation
- **US-001**: As a field employee, I want location tracking to continue even if I close the app
- **US-002**: As a field employee, I want tracking to resume after short interruptions
- **US-003**: As an admin, I want to know why an emergency check-out occurred

### Epic 2: Internet Disconnection Handling
- **US-004**: As a field employee, I want 1 hour of offline tracking before check-out
- **US-005**: As a field employee, I want my last known location saved if internet fails

### Epic 3: Permission Management
- **US-006**: As a field employee, I want clear explanations when permissions cause check-out
- **US-007**: As an admin, I want to track permission-related service stops

## 8. Edge Cases & Scenarios

### 8.1 Handled Scenarios
1. Normal operation (check-in → check-out)
2. App background/foreground transitions
3. Internet loss < 1 hour (service continues)
4. Internet loss > 1 hour (emergency check-out)
5. App crash < 15 minutes (resume service)
6. App crash > 15 minutes (emergency check-out)
7. Phone restart (emergency check-out on restart)
8. Permission revocation (immediate emergency check-out)
9. Battery drain at 5% (emergency check-out)
10. Multiple failures (first triggered scenario)

### 8.2 Decision Matrix
| Scenario | Time Threshold | Action |
|----------|----------------|--------|
| Service dead, last update < 15 min | 15 min | Resume tracking |
| Service dead, last update > 15 min | 15 min | Emergency check-out |
| No internet, service running | 1 hour | Emergency check-out |
| Permission revoked | Immediate | Emergency check-out |
| Battery at 5% | Immediate | Emergency check-out |

## 9. Dependencies

### 9.1 Technical Dependencies
- Current Notifee implementation
- Existing attendance store structure
- Battery and device info APIs
- Permission service integration

### 9.2 Business Dependencies
- Field employee attendance process
- Admin dashboard for monitoring
- Compliance audit requirements

## 10. Assumptions

- Notifee keeps service running unless Android kills it
- 5-minute sync is acceptable for field tracking needs
- Simple overwrite strategy is sufficient for emergency data
- Battery percentage is accurately reported by device

## 11. Constraints

- Must keep implementation simple
- No complex offline queuing mechanisms
- Internet grace only applies if service is still running
- Cannot track if user manually disables location services

## 12. Testing Requirements

### 12.1 Test Scenarios
- All 20 scenarios identified (normal operation through edge cases)
- Automated tests for critical paths
- Manual testing for device-specific behaviors

### 12.2 Acceptance Criteria
- Service continues through normal interruptions
- Emergency recovery works for all failure scenarios
- Data integrity maintained throughout
- Clear user communication for all scenarios

## 13. Success Metrics

### 13.1 Technical Metrics
- Service uptime percentage
- Emergency check-out false positive rate
- Data recovery success rate
- API call success rate

### 13.2 Business Metrics
- Field employee productivity impact
- Admin review time reduction
- Compliance audit completeness
- User satisfaction with reliability

## 14. Risks

### 14.1 Technical Risks
- Android OS killing foreground service
- Device-specific battery optimizations
- Inaccurate GPS in poor signal areas
- Storage corruption for emergency data

### 14.2 Business Risks
- User frustration with emergency check-outs
- Incomplete audit trails
- False emergency scenarios

## 15. Timeline

- Phase 1 (Core scenarios): 2-3 days
- Phase 2 (Edge cases): 1-2 days
- Phase 3 (Testing): 2 days
- Total: 5-7 days

## User Journeys

**Journey 1: Raj Kumar - Field Sales Executive**

Raj is a sales executive who covers multiple retail outlets across the city. His company needs to ensure he's actually visiting the assigned locations and spending adequate time at each. In the past, there were issues with employees claiming to visit sites when they hadn't.

One Monday morning, Raj checks into the app at his first store. He knows the location tracking is running, so he focuses on his work rather than worrying about the app. As he moves between stores, he occasionally notices the tracking notification but doesn't need to interact with it.

During his lunch break, he accidentally swipes away the notification, but the service continues running in the background. In the afternoon, he enters an area with poor network coverage - the app keeps storing his location locally. When network returns, everything syncs automatically.

At 5 PM, Raj checks out normally. His manager sees a complete path of his day with all store visits clearly marked.

The critical moment comes when his colleague tries to cheat the system by turning off location services - the app immediately performs an emergency check-out with the exact location and reason. This reinforces that the system is working and accountability is maintained.

**Journey 2: Priya Sharma - Operations Manager**

Priya manages a team of 15 field employees. Her main challenge was ensuring team members were actually completing their routes and not taking unauthorized breaks.

Each morning, she opens the dashboard and sees her team checking in across the city. The real-time map shows green dots moving along their assigned routes. When an employee's dot disappears, she can immediately see why - battery drain, permission issue, or legitimate service failure.

One Tuesday, she notices Raj's tracking stopped. The system shows an emergency check-out at 2:15 PM with "Service interrupted - app crash" reason. She can see his exact last location and knows he was at his scheduled store. When Raj calls to explain, she already has all the context.

The breakthrough comes at the end of the month when reviewing attendance reports. The data is complete and defensible - no more disputes about whether someone was working or not. Priya can focus on managing performance instead of investigating attendance issues.

**Journey 3: Amit Verma - HR Compliance Manager**

Amit is responsible for ensuring compliance with field work policies and handling disputes. His biggest challenge was investigating attendance claims without reliable data.

On a quarterly review, an employee claims they worked a full day but the system shows only 4 hours of tracking. Previously, this would become a he-said-she-said debate. Now, Amit can pull up the complete audit trail.

He sees the employee checked in at 9 AM, tracking worked perfectly until 11:30 AM when the phone battery reached 5%. The system performed an emergency check-out with exact GPS coordinates showing the employee was at a client location. The data is irrefutable.

The real value comes during a labor inspection. When regulators ask for attendance records, Amit can provide complete location paths with battery levels and emergency check-out reasons. The audit trail is so comprehensive that the inspector quickly moves on to other areas.

Six months later, Amit has reduced time spent on attendance disputes by 90% and has defensible documentation for compliance requirements.

**Journey 4: Suresh Kumar - IT Support Engineer**

Suresh handles technical issues for the field team. Before the enhanced system, he spent hours investigating "app not working" tickets without clear data.

A field employee calls saying "the app stopped tracking." Suresh can now see exactly what happened:
- Service was running continuously
- Last successful sync at 2:45 PM
- Network lost at 3:00 PM
- Service continued storing locally
- 1-hour timeout triggered emergency check-out at 4:00 PM
- Employee location when emergency check-out occurred

Suresh can explain precisely what happened and why. The transparency reduces user frustration and support calls.

The breakthrough comes when management asks about system reliability. Suresh can provide exact metrics: 99.7% service uptime, clear reasons for all failures, and proof that the system is working as designed.

**Journey 5: Ravi Singh - Employee Testing System Limits**

Ravi is tech-savvy and tries to find loopholes in the tracking system. He learns quickly that the system is designed for accountability.

First attempt: Turning off location services immediately triggers emergency check-out with "Location permission revoked" reason. Admin is notified.

Second attempt: Force-killing the app works initially, but when he restarts the app, it detects service interruption and performs emergency check-out.

Third attempt: Turning off internet for 2 hours. He thinks he's found a loophole, but returns to find an emergency check-out triggered after 1 hour of offline time.

Fourth attempt: Disabling notifications. The service continues running silently in the background, still tracking every 5 minutes.

After multiple attempts, Ravi realizes the system is designed to handle all scenarios. He accepts that the only way to avoid tracking is to not check in at all - which would be immediately obvious.

### Journey Requirements Summary

These journeys reveal requirements for:
- Emergency recovery with exact location and reason tracking
- Admin dashboard with real-time monitoring and historical review
- Comprehensive audit trails for compliance and dispute resolution
- Technical diagnostics and support tools for IT teams
- Robust handling of all failure and tampering scenarios
- Clear notification system for critical events only
- Automatic sync recovery after network restoration
- Service lifecycle management across all device states

## Mobile App Specific Requirements

### Mobile App Overview

This React Native mobile application enhancement focuses on Android-only deployment for field employee location tracking, leveraging Expo for cross-platform development while targeting Android's more permissive background execution policies for reliable foreground service operation.

### Platform Requirements

**Target Platform:** Android (current focus)
- React Native with Expo framework
- Minimum Android version: API 21+ (Expo default)
- Target Android version: API 30+ for foreground service compatibility
- Planned iOS support: Not in MVP (future consideration)

**Rationale for Android-First:**
- Android's flexible foreground service policies support 5-minute tracking intervals
- More predictable background execution compared to iOS limitations
- Enterprise deployment typically Android-dominant in field workforce

### Device Permissions

**Critical Permissions:**
1. **Location Permission** - "Allow all the time" access required
   - Continuous GPS tracking during work hours
   - Background location access for service persistence

2. **Camera Permission** - Required for check-in photos
   - Face recognition attendance verification
   - Reference photo capture for admin uploads

3. **Notification Permission** - Foreground service requirement
   - Persistent service notification
   - Emergency check-out alerts
   - Permission revocation warnings

**Monitoring Strategy:**
- Permission status checked every 30 seconds during active tracking
- Immediate emergency check-out on permission revocation
- Graceful handling of "While in app" vs "Always" location permission levels

### Offline Mode

**Emergency-First Offline Strategy:**
- Local storage overwrite every 5 minutes (not complex queuing)
- Emergency data persisted across app crashes and device restarts
- 1-hour internet grace period when service continues running
- Immediate emergency check-out when service cannot continue

**Data Storage:**
```typescript
interface EmergencyData {
  attendanceId: string;
  lastLocationUpdate: {
    timestamp: number;
    coordinates: [number, number];
    batteryLevel: number;
  };
  trackingActive: boolean;
  lastKnownTime: number; // Last successful API sync
  lastStoredTime: number; // Always current time
}
```

### Push Strategy

**Service-Driven Notifications (Not Traditional Push):**
- Notifee-based persistent service notification
- Real-time countdown timer display
- Emergency scenario alerts
- No server-initiated push notifications required

**Notification Types:**
1. **Active Tracking** - "Next sync in X seconds" countdown
2. **Emergency Check-out** - Battery, permissions, internet timeout
3. **Service Recovery** - "Tracking resumed after interruption"

### Store Compliance

**Enterprise Distribution:**
- Private channel distribution for enterprise control
- Admin-controlled update deployment
- No public Play Store listing required

**Update Management:**
- Critical security/fix updates immediate deployment
- Feature updates scheduled during non-work hours
- Graceful update handling during active tracking sessions

### Implementation Considerations

**Battery Optimization Handling:**
- Notifee foreground service type: LOCATION + MEDIA_PLAYBACK
- 5-minute intervals balance battery vs accountability requirements
- Critical battery threshold (5%) prevents device shutdown

**Android OEM Compatibility:**
- Tested on manufacturer-specific battery optimizations
- Whitelisting recommendations for enterprise devices
- Fallback handling for aggressive battery savers

**Service Lifecycle Management:**
- Automatic recovery from app crashes (< 15 minutes)
- Emergency check-out for device restarts
- Service health monitoring with self-healing capabilities

**Memory Management:**
- Single emergency data record stored locally
- Emergency data overwritten every 5 minutes (not accumulating)
- No location history storage on device (server is source of truth)
- Emergency data cleared on successful check-out

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP - Solve the core accountability problem with absolute reliability and zero gaps in tracking

**Resource Requirements:**
- 1 React Native developer
- 1 backend developer (Supabase)
- 1 QA tester
- 5-7 day timeline for MVP implementation

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Field employee: Check-in → Continuous tracking → Check-out
- Operations manager: Real-time monitoring and historical review
- Emergency scenarios: Battery, permissions, service interruption

**Must-Have Capabilities:**
1. **Service Persistence**
   - Notifee foreground service with LOCATION + MEDIA_PLAYBACK type
   - Continuous operation regardless of app state
   - 5-minute sync intervals to server

2. **Emergency Data Management**
   - Single emergency data record stored locally
   - Overwritten every 5 minutes during sync
   - Contains: last location, battery level, timestamp, attendance ID

3. **Scenario Handling**
   - Battery drain at 5% → Emergency check-out
   - Permission revocation → Immediate emergency check-out
   - Internet loss → 1-hour grace period (if service running)
   - App/device restart → Emergency check-out on recovery

4. **Admin Dashboard**
   - Real-time map view of active employees
   - Complete location path visualization
   - Emergency check-out indicators with reasons

### Post-MVP Features

**Phase 2 (Post-MVP):**
- Service health monitoring dashboard
- Pattern detection for repeated "technical issues"
- Better admin notifications for different emergency types
- Android OEM compatibility improvements

**Phase 3 (Expansion):**
- iOS support development
- Advanced analytics on field coverage
- Device fingerprinting for enhanced security
- Automated alerts for suspicious behavior patterns

### Risk Mitigation Strategy

**Technical Risks:** Android battery optimization killing service
- Mitigation: Multiple Notifee service types + enterprise device whitelisting
- Fallback: Emergency data ensures no complete data loss

**Market Risks:** Employees finding workarounds to gaming system
- Mitigation: Comprehensive scenario testing + immediate check-out on all permission changes
- Validation: Internal testing with tech-savvy employees

**Resource Risks:** Testing across different Android OEMs
- Mitigation: Focus on enterprise devices initially, expand compatibility later
- Contingency: OEM-specific configuration guides for IT teams

## 16. Sign-off

**Product Owner:** _________________________
**Development Lead:** _________________________
**QA Lead:** _________________________
**Date:** _________________________