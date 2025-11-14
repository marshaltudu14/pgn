# Phase 2: Mobile App & Basic Attendance Flow

**Duration:** 1 Week (5-7 working days)
**Team Size:** 2-3 Developers (1 mobile-focused, 1-2 backend)
**Focus:** Complete mobile app attendance functionality with GPS and basic verification
**Success Criteria:** Fully functional mobile check-in/check-out with GPS location and photo capture

---

## Phase Overview

Phase 2 delivers the core mobile attendance functionality that forms the heart of the PGN system. This phase focuses on implementing the mobile app screens, camera integration, GPS location capture, and the basic check-in/check-out workflow. The system will work with simple photo capture initially, preparing for face recognition integration in Phase 4.

## Current State Assessment

### What's Already Completed ✅
- **Authentication System:** Complete JWT authentication with employee management
- **Database Schema:** Ready employees and daily_attendance tables
- **Mobile Project Structure:** React Native app with navigation and dependencies
- **Required Dependencies:** Camera, location, expo-secure-store, SQLite already configured
- **API Foundation:** Authentication endpoints and basic structure
- **UI Components:** shadcn/ui components ready for web admin interface

### What Needs to be Built 🚧
- **Mobile App Screens:** Home, settings, attendance status screens
- **Camera Integration:** Photo capture for check-in/check-out
- **GPS Location Services:** Location capture with accuracy validation
- **Attendance API:** Complete attendance endpoints with database operations
- **Background Services:** Basic location tracking setup (without face recognition yet)
- **Admin Verification Interface:** Simple photo verification for admin

## Detailed Feature Breakdown

### 1. Mobile App Core Screens

#### 1.1 Main Home Screen
**Requirements:**
- Employee information display (name, user ID, current status)
- Large check-in/check-out buttons with clear visual states
- Today's attendance summary (check-in time, work duration if applicable)
- Battery level indicator and GPS status display
- Quick access to settings and profile

**Screen Components:**
```javascript
// Home Screen Layout
const HomeScreen = () => {
  const { user, currentAttendance, isLoading } = useAttendanceStore();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with employee info */}
      <EmployeeInfoHeader employee={user} />

      {/* Main status card */}
      <AttendanceStatusCard
        attendance={currentAttendance}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        isLoading={isLoading}
      />

      {/* Today's summary */}
      <TodaySummaryCard attendance={currentAttendance} />

      {/* Bottom navigation */}
      <BottomNavigation />
    </SafeAreaView>
  );
};
```

#### 1.2 Settings Screen
**Requirements:**
- Employee profile information display (read-only)
- Logout functionality with confirmation
- App version and support information
- Permission status indicators (camera, location, background location)
- Regional assignment display
- About section with company information

**Settings Features:**
- Profile information display (name, employee ID, contact info)
- Regional assignment visualization
- Permission checking with links to app settings
- Secure logout with local data cleanup
- Help and support options

#### 1.3 Attendance Status Screen
**Requirements:**
- Detailed attendance history view
- Current attendance session information
- Work hours calculation and display
- Location information for check-in/out
- Photo preview from attendance sessions
- Export functionality for attendance data

### 2. Camera Integration & Photo Capture

#### 2.1 Camera Implementation
**Requirements:**
- React Native Camera integration with expo-camera
- Front-facing camera configuration for selfies
- High-quality photo capture settings
- Image compression and optimization
- Camera permission handling with mandatory flow
- Error handling for camera failures

**Camera Features:**
```javascript
// Camera Component Setup
const AttendanceCamera = ({ onPhotoCapture, onClose }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false
      });
      onPhotoCapture(photo);
    }
  };

  // Camera UI with overlay and guidance
  return (
    <Camera style={styles.camera} type={CameraType.front} ref={setCameraRef}>
      <CameraOverlay />
      <CaptureButton onPress={takePicture} />
      <CancelButton onPress={onClose} />
    </Camera>
  );
};
```

#### 2.2 Photo Processing & Storage
**Requirements:**
- Image compression for efficient storage and upload
- Base64 encoding for API transmission
- Local storage for offline scenarios
- Metadata preservation (timestamp, location)
- Photo quality validation
- Secure temporary storage before upload

**Photo Processing Pipeline:**
```javascript
const processAttendancePhoto = async (photo, location) => {
  // 1. Compress image
  const compressedImage = await ImageManipulator.compressAsync(photo.uri, {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  // 2. Convert to base64
  const base64Data = await FileSystem.readAsStringAsync(compressedImage.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 3. Create photo metadata
  const photoMetadata = {
    data: base64Data,
    timestamp: new Date().toISOString(),
    location: {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    },
    deviceInfo: await getDeviceInfo(),
  };

  return photoMetadata;
};
```

### 3. GPS Location Services Integration

#### 3.1 Location Capture Implementation
**Requirements:**
- Current location capture with accuracy validation
- Location permission handling (foreground and background)
- GPS accuracy checking (minimum 10 meters requirement)
- Location error handling and retry logic
- Location data formatting for database storage
- Battery level integration with location data

**Location Service Implementation:**
```javascript
const getCurrentLocation = async () => {
  try {
    // Check permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    // Get current location with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000, // 10 seconds
      timeout: 15000, // 15 seconds
    });

    // Validate accuracy
    if (location.coords.accuracy > 20) {
      throw new Error(`GPS accuracy too low: ${location.coords.accuracy}m`);
    }

    // Get battery level
    const batteryLevel = await Battery.getBatteryLevelAsync();

    return {
      coords: location.coords,
      timestamp: location.timestamp,
      batteryLevel: Math.round(batteryLevel * 100),
    };

  } catch (error) {
    console.error('Location capture error:', error);
    throw error;
  }
};
```

#### 3.2 Background Location Setup (Foundation)
**Requirements:**
- Background location permission handling
- Basic location tracking service setup (without 5-minute intervals yet)
- Location task management with expo-task-manager
- Battery optimization configuration
- Foundation for Phase 3 location tracking

**Background Location Foundation:**
```javascript
// Basic background location task setup
const LOCATION_TASK_NAME = 'background-location-task';

const startLocationTracking = async () => {
  // Request background location permission
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Background location permission denied');
  }

  // Define background task
  TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
    if (error) {
      console.error('Background location error:', error);
      return;
    }

    if (data) {
      const { locations } = data;
      // Process location updates (will be enhanced in Phase 3)
      processLocationUpdates(locations);
    }
  });

  // Start location tracking (basic setup)
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 300000, // 5 minutes (will be used in Phase 3)
    distanceInterval: 50, // 50 meters
    showsBackgroundLocationIndicator: true,
  });
};
```

### 4. Attendance API Implementation

#### 4.1 Check-in/Check-out Endpoints
**Requirements:**
- POST /api/attendance/checkin - Process check-in with photo and location
- POST /api/attendance/checkout - Process check-out with photo and location
- GET /api/attendance/status - Get current attendance status
- GET /api/attendance/history - Get attendance history for user
- PUT /api/attendance/emergency-checkout - Handle emergency scenarios

**Check-in Endpoint Implementation:**
```javascript
// POST /api/attendance/checkin
const handleCheckIn = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      locationAccuracy,
      batteryLevel,
      photoData,
      timestamp
    } = req.body;

    const employeeId = req.user.id;

    // Validate required fields
    if (!latitude || !longitude || !photoData) {
      return res.status(400).json({
        error: 'Location and photo are required for check-in'
      });
    }

    // Check if already checked in
    const existingAttendance = await getActiveAttendance(employeeId);
    if (existingAttendance) {
      return res.status(400).json({
        error: 'Already checked in'
      });
    }

    // Get location name (geocoding)
    const locationName = await getLocationName(latitude, longitude);

    // Create attendance record
    const attendance = await createAttendanceRecord({
      employeeId,
      checkInTimestamp: timestamp || new Date().toISOString(),
      checkInLatitude: latitude,
      checkInLongitude: longitude,
      checkInLocationName: locationName,
      checkInSelfieData: photoData,
      batteryLevelAtCheckIn: batteryLevel,
      verificationStatus: 'PENDING', // Will be 'VERIFIED' after admin verification
    });

    // Start background location tracking (Phase 3 enhancement)
    await startLocationTrackingForEmployee(employeeId);

    res.json({
      success: true,
      attendance: {
        id: attendance.id,
        checkInTime: attendance.check_in_timestamp,
        location: locationName,
        batteryLevel: attendance.battery_level_at_check_in,
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
};
```

#### 4.2 Emergency Check-out Handling
**Requirements:**
- Automatic check-out for various scenarios
- Emergency data capture and storage
- Proper audit logging for emergencies
- Admin notifications for emergency scenarios

**Emergency Scenarios:**
```javascript
const handleEmergencyCheckOut = async (employeeId, reason, lastLocationData) => {
  try {
    // Get active attendance record
    const attendance = await getActiveAttendance(employeeId);
    if (!attendance) return;

    // Emergency check-out data
    const emergencyData = {
      checkOutTimestamp: new Date().toISOString(),
      checkOutLatitude: lastLocationData?.latitude,
      checkOutLongitude: lastLocationData?.longitude,
      checkOutMethod: 'EMERGENCY',
      checkOutReason: reason,
      batteryLevelAtCheckOut: lastLocationData?.batteryLevel,
      verificationStatus: 'FLAGGED', // Requires admin review
    };

    // Update attendance record
    await updateAttendanceRecord(attendance.id, emergencyData);

    // Create security event
    await createSecurityEvent({
      employeeId,
      eventType: 'EMERGENCY_CHECKOUT',
      eventDetails: {
        reason,
        location: lastLocationData,
        timestamp: emergencyData.checkOutTimestamp,
      },
      threatLevel: 'MEDIUM',
    });

    // Notify administrators
    await notifyAdminsForEmergencyCheckout(employeeId, emergencyData);

    // Stop location tracking
    await stopLocationTrackingForEmployee(employeeId);

  } catch (error) {
    console.error('Emergency check-out error:', error);
  }
};
```

### 5. Admin Verification Interface

#### 5.1 Simple Photo Verification Dashboard
**Requirements:**
- List of pending attendance verifications
- Photo preview interface for check-in/out
- Location validation with map display
- Quick approve/reject functionality
- Verification status management
- Bulk verification capabilities

**Verification Interface Components:**
```javascript
// Verification Queue Component
const VerificationQueue = () => {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedVerification, setSelectedVerification] = useState(null);

  return (
    <div className="verification-dashboard">
      {/* Verification queue list */}
      <div className="verification-list">
        <h3>Pending Verifications ({pendingVerifications.length})</h3>
        {pendingVerifications.map((verification) => (
          <VerificationCard
            key={verification.id}
            verification={verification}
            onSelect={setSelectedVerification}
          />
        ))}
      </div>

      {/* Photo verification interface */}
      {selectedVerification && (
        <PhotoVerificationInterface
          verification={selectedVerification}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};
```

#### 5.2 Photo Comparison Interface
**Requirements:**
- Side-by-side photo display (current selfie vs reference photo)
- Location information display with map
- Timestamp and device information
- Verification decision interface
- Comment functionality for rejections
- Verification history tracking

### 6. Mobile State Management

#### 6.1 Attendance Store (Zustand)
**Requirements:**
- Current attendance status management
- Check-in/check-out state handling
- Location tracking state
- Photo capture state
- Offline data management
- Error state handling

**Attendance Store Implementation:**
```javascript
// Store for attendance-related state
const useAttendanceStore = create((set, get) => ({
  // State
  currentAttendance: null,
  isCheckingIn: false,
  isCheckingOut: false,
  locationTrackingActive: false,
  lastKnownLocation: null,
  offlineQueue: [],

  // Actions
  checkIn: async (photoData) => {
    set({ isCheckingIn: true });
    try {
      const location = await getCurrentLocation();
      const batteryLevel = await Battery.getBatteryLevelAsync();

      const result = await api.attendance.checkIn({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        locationAccuracy: location.coords.accuracy,
        batteryLevel: Math.round(batteryLevel * 100),
        photoData,
        timestamp: new Date().toISOString(),
      });

      set({
        currentAttendance: result.attendance,
        lastKnownLocation: location,
        isCheckingIn: false,
      });

      // Start location tracking
      await startLocationTracking();

      return result;
    } catch (error) {
      set({ isCheckingIn: false });
      throw error;
    }
  },

  checkOut: async (photoData) => {
    set({ isCheckingOut: true });
    try {
      const location = await getCurrentLocation();
      const batteryLevel = await Battery.getBatteryLevelAsync();

      const result = await api.attendance.checkOut({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        locationAccuracy: location.coords.accuracy,
        batteryLevel: Math.round(batteryLevel * 100),
        photoData,
        timestamp: new Date().toISOString(),
      });

      set({
        currentAttendance: null,
        locationTrackingActive: false,
        isCheckingOut: false,
      });

      // Stop location tracking
      await stopLocationTracking();

      return result;
    } catch (error) {
      set({ isCheckingIn: false });
      throw error;
    }
  },
}));
```

## Technical Implementation Details

### Database Integration

#### Daily Attendance Table Usage
- **Check-in Fields:** check_in_timestamp, check_in_latitude, check_in_longitude, check_in_location_name
- **Check-out Fields:** check_out_timestamp, check_out_latitude, check_out_longitude, check_out_location_name
- **Photo Storage:** check_in_selfie_data, check_out_selfie_data (base64 encoded)
- **Battery Monitoring:** battery_level_at_check_in, battery_level_at_check_out
- **Verification:** verification_status, verified_by, verified_at, verification_notes
- **Path Data:** path_data (ready for Phase 3), last_location_update

#### Attendance Status Management
```sql
-- Attendance status transitions
-- PENDING -> VERIFIED (admin approval)
-- PENDING -> REJECTED (admin rejection)
-- PENDING -> FLAGGED (automatic/emergency scenarios)

-- Check-in/out method tracking
-- MANUAL (normal check-in/out)
-- AUTOMATIC (system-generated check-out)
-- EMERGENCY (emergency scenarios)
-- TIMEOUT (maximum hours exceeded)
```

### Mobile App Architecture

#### Screen Navigation Structure
```
App Navigation
├── Auth Stack (when not authenticated)
│   ├── Login Screen
│   └── Registration (if implemented)
└── Main Stack (when authenticated)
    ├── Home Screen (tab)
    ├── History Screen (tab)
    ├── Settings Screen (tab)
    └── Modal Screens
        ├── Camera Modal
        ├── Location Permission Modal
        └── Error/Alert Modals
```

#### Error Handling Strategy
- Network connectivity checking before API calls
- Retry mechanisms for failed operations
- Offline queue for attendance data
- User-friendly error messages
- Automatic recovery where possible

### Security Considerations

#### Data Security
- Base64 photo data encryption in transit
- Location data privacy protection
- Secure API communication with JWT
- Local data encryption for offline storage
- Audit trail for all attendance actions

#### Permission Management
- Mandatory camera permission with clear explanations
- Location permission with background access
- Secure storage of biometric data
- Permission status monitoring

## Success Criteria

### Functional Requirements
✅ Complete mobile check-in/check-out workflow
✅ Photo capture with quality validation
✅ GPS location capture with accuracy requirements
✅ Basic admin verification interface
✅ Emergency check-out handling
✅ Offline data handling foundation

### Performance Requirements
- Check-in processing time under 5 seconds
- Photo capture and processing under 3 seconds
- GPS location acquisition under 10 seconds
- App startup time under 5 seconds
- API response times under 2 seconds

### User Experience Requirements
- Intuitive interface with clear visual feedback
- Error messages that guide users to resolution
- Smooth photo capture experience with guidance
- Location permission flow with clear explanations
- Battery level awareness and optimization

## Testing Strategy

### Mobile App Testing
- Camera functionality across different devices
- GPS accuracy and reliability testing
- Network connectivity scenarios (online/offline)
- Permission handling testing
- Battery impact assessment

### API Testing
- Check-in/check-out endpoint validation
- Photo upload and storage testing
- Location data processing validation
- Error handling and edge cases
- Security vulnerability testing

### Integration Testing
- End-to-end attendance flow testing
- Admin verification workflow testing
- Emergency scenario testing
- Cross-platform compatibility testing
- Performance under load testing

## Risk Mitigation

### Technical Risks
1. **Camera Compatibility:** Test across various Android devices and versions
2. **GPS Accuracy:** Implement accuracy validation and fallback mechanisms
3. **Battery Usage:** Optimize location tracking frequency and accuracy
4. **Network Reliability:** Implement robust offline data handling

### Business Risks
1. **User Adoption:** Simplify attendance flow with clear guidance
2. **Data Accuracy:** Implement validation and verification processes
3. **Privacy Concerns:** Ensure transparent data handling and user consent
4. **Performance:** Optimize app performance and battery usage

## Dependencies & Prerequisites

### Phase Dependencies
- **Phase 1 Complete:** Authentication system and employee management
- **Camera Hardware:** Devices with working cameras
- **GPS Capabilities:** Devices with GPS functionality
- **Permissions:** Proper app permissions configured

### External Dependencies
- Supabase database access
- Map service API for geocoding
- Push notification service (optional)
- Device testing capabilities

## Handoff to Phase 3

### Deliverables for Next Phase
1. **Complete Mobile Attendance App:** Full check-in/out functionality
2. **Photo Verification System:** Admin interface for attendance verification
3. **Location Foundation:** Basic location services ready for enhancement
4. **Attendance API:** Complete backend endpoints
5. **Error Handling:** Robust error handling and user guidance

### Preparation Checklist
- [ ] Mobile app fully functional on target devices
- [ ] Photo capture and storage working correctly
- [ ] GPS location capture meeting accuracy requirements
- [ ] Admin verification interface operational
- [ ] API endpoints tested and documented
- [ ] Error handling and edge cases covered
- [ ] Phase 3 requirements understood and planned

---

## Phase Review Process

### Review Criteria
1. **Mobile Functionality:** Complete attendance workflow on mobile devices
2. **Photo Quality:** Clear, usable photos for verification
3. **Location Accuracy:** GPS meets accuracy and reliability requirements
4. **User Experience:** Intuitive interface with proper error handling
5. **Admin Interface:** Functional verification system for administrators

### Review Deliverables
1. **Mobile App Report:** Functionality and performance assessment
2. **User Testing Results:** Feedback from actual users
3. **API Documentation:** Complete endpoint documentation
4. **Security Assessment:** Photo and data security validation
5. **Phase 3 Readiness:** Preparedness for location tracking enhancement

### Approval Requirements
- Mobile app testing across target devices completed
- User acceptance testing signed off
- Security team approval of photo handling
- Product owner acceptance of user experience
- Technical lead sign-off on implementation quality