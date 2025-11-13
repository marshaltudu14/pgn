# PGN Location Tracking & Attendance MVP Implementation Plan

**Project:** PGN Sales & CRM System - Secure Location Tracking Module
**Focus:** Path tracking, client-side face recognition attendance, comprehensive audit logging, enterprise security
**Technologies:** React Native (mobile), Next.js (admin portal), Supabase (backend), Client-side face recognition, JWT authentication
**Version:** Secure Enhanced MVP 1.0
**Date:** 2025-11-12

## Executive Summary

This secure enhanced MVP implementation plan focuses on building a comprehensive, enterprise-grade location tracking and attendance system for PGN's sales team with advanced security features including path tracking visualization, unique human-readable user IDs, JWT authentication for API security, and comprehensive audit logging. The solution includes client-side face recognition verification with manual fallback, smart daily attendance data storage, path tracking with movement threshold filtering, and robust security measures against external attacks. The system is designed for 15-100 salespeople with offline-first capabilities, military-grade security, and complete auditability.

## System Architecture Overview

### Core Components

1. **React Native Mobile App** - Secure location tracking, path tracking, client-side face recognition, offline storage
2. **Next.js Admin Portal** - Secure monitoring dashboard, audit logs, path visualization, verification interface
3. **Supabase Backend** - Smart database schema with consolidated daily attendance data
4. **JWT Authentication Gateway** - Route-level token validation for API security only
5. **API Security Layer** - Request validation, rate limiting, external request blocking
6. **Client-Side Face Recognition** - On-device TensorFlow Lite processing for efficiency
7. **Path Tracking Engine** - Movement analysis and path visualization with 50m threshold filtering
8. **Smart Daily Storage System** - Consolidated attendance data with path information per day
9. **Service Layer** - Secure business logic in Next.js service files with Supabase integration
10. **Shared Types** - TypeScript definitions for monorepo

### Technology Stack

- **Mobile:** React Native (Android only) with secure background location services
- **Web:** Next.js admin dashboard with OpenStreetMap and path visualization
- **Backend:** Supabase (PostgreSQL database) with Row Level Security (RLS) and smart schema
- **Authentication:** JWT tokens for API gateway only (no database storage)
- **Face Recognition:** Client-side TensorFlow Lite for efficiency and privacy
- **API Security:** Next.js API routes with middleware protection, rate limiting, external request blocking
- **State Management:** Zustand (shared between web and mobile) with secure persistence
- **Maps:** OpenStreetMap with path rendering and movement visualization
- **Real-time:** Polling-based updates (no WebSockets) with secure token validation
- **File Storage:** Supabase Storage with access controls and audit logging
- **Security:** Bcrypt password hashing, request signing, certificate pinning, intrusion detection
- **Project Structure:** Monorepo with shared packages and secure configuration

## MVP Core Features

### 1. Enhanced Location Tracking System

#### 1.1 Path Tracking with Movement Analysis

**Enhanced Tracking Rules:**
- **Only when checked in:** Location tracking active only between check-in and check-out
- **Fixed interval:** Send location updates every 5 minutes to server
- **Path filtering:** Show path only when salesman travels at least 50 meters
- **Automatic stop:** Tracking stops immediately upon check-out
- **Movement detection:** Only display paths for actual movement, not idle time

**Path Tracking Implementation:**
- Background location service with distance calculation between points
- Movement threshold validation (50 meters minimum before adding to path)
- Path smoothing algorithm to remove GPS noise and jitter
- Secure path data transmission with JWT authentication
- Local path storage with encrypted compression for offline mode

**Path Visualization Features:**
- **Unique Colored Paths:** Each salesman assigned a unique color for easy tracking
- **Color Assignment:** Automatically assign distinct colors from predefined palette
- **Real-time path rendering** on admin dashboard map with individual colors
- **Color-coded by Time:** Recent segments in brighter shades, older segments faded
- **Path animation** showing movement timeline with salesman colors
- **Legend Display:** Show color assignments for easy salesman identification
- **Distance and duration calculations** for each path segment
- **Regional Overlays:** Show assigned region boundaries on map
- **Export path data** for analysis and reporting

**Color Assignment Algorithm:**
```javascript
const assignUniqueColors = (salesmen) => {
  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#48DBFB', '#0ABDE3', '#006BA6',
    '#FFB6C1', '#4A90E2', '#7B68EE', '#FF6F61', '#6B5B95'
  ];

  return salesmen.map((salesman, index) => ({
    ...salesman,
    pathColor: colorPalette[index % colorPalette.length],
    colorIndex: index
  }));
};
```

**Regional Assignment Display:**
- **Region Visualization:** Show assigned regions with boundaries on mobile app map
- **Multiple Region Support:** Display all regions assigned to salesman
- **Primary Region Highlight:** Emphasize primary operational region
- **Informative Only:** Regions displayed for salesman awareness only
- **No Automated Compliance:** Manual monitoring by admin only

#### 1.2 Unique User ID System

**Human-Readable User IDs:**
- Format: PGN-YYYY-NNNN (PGN Salesman-Year-4Digit Sequence)
- Example: PGN-2024-0001, PGN-2024-0002
- Auto-generated with year-based prefix for easy identification
- Cannot be changed once assigned for audit trail integrity
- Used for both login and tracking identification

**User ID Features:**
- Unique validation to prevent duplicates
- Searchable in admin dashboard for quick identification
- Displayed on all attendance and tracking records
- Used in audit logs for clear user identification
- Human-friendly for admin communication and reporting

#### 1.3 Simplified JWT Authentication System

**JWT Authentication for API Security Only:**
- **Access Tokens:** Short-lived (15 minutes) JWT with user claims
- **No Database Storage:** JWT handled entirely at route level
- **Route-Level Validation:** API middleware extracts and validates JWT
- **Direct Supabase Access:** Routes use Supabase auth after JWT validation
- **Token Storage:** Secure encrypted storage on mobile (Keystore/Keychain)

**Authentication Flow with Employment Status Handling:**
1. Initial login with User ID and password via API
2. Server validates credentials with Supabase auth
3. Server checks user employment status and can_login flag
4. If user employment status prevents login, return specific error message
5. If user can login, return JWT access token
6. Mobile app securely stores token with device-specific encryption
7. All API calls include JWT in Authorization header
8. API middleware validates JWT and checks employment status
9. API routes use Supabase auth context for database operations
10. Login again when token expires (simple re-authentication)

**Employment Status Authentication Handling:**
```javascript
// Server-side login validation
const validateUserLogin = async (salesmanId) => {
  const user = await getSalesman(salesmanId);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.is_deleted) {
    return {
      success: false,
      error: 'User account has been deleted',
      deletionReason: user.deletion_reason
    };
  }

  if (!user.is_active) {
    return {
      success: false,
      error: 'User account is deactivated',
      contactAdmin: true
    };
  }

  return { success: true };
};

// Mobile app error handling
if (loginResponse.error === 'User account has been deleted') {
  showUserDeletedScreen();
  clearLocalData();
  return;
}
```

**Security Benefits:**
- No JWT token storage in database
- Complete employment status audit trail
- Data preservation for legal compliance
- Clean separation between app auth and API security
- Direct Supabase RLS policies still work
- Simplified token management
- Secure logout by clearing local storage
- Full audit trail of all user status changes

### 1.4 API Security Architecture

**Complete Request Security:**
- **API Route Protection:** All API routes protected with JWT middleware
- **External Request Blocking:** Only allow requests from authorized mobile/web clients
- **Request Signing:** Each request signed with client-side secret for integrity verification
- **Rate Limiting:** Per-user rate limiting to prevent brute force attacks
- **No IP Restrictions:** Open access for mobile field operations
- **CORS Configuration:** Strict CORS settings to prevent unauthorized access

**Security Middleware Stack:**
- JWT token validation and expiration checking
- Request signature verification
- User agent and device fingerprint validation
- SQL injection and XSS protection
- Request size and rate limiting
- Audit logging of all security events
- Suspicious activity detection and alerting

**Attack Prevention Measures:**
- **Brute Force Protection:** Account lockout after failed attempts
- **Replay Attack Prevention:** Request timestamp validation and nonce usage
- **Man-in-the-Middle Protection:** Certificate pinning for mobile app
- **Token Theft Protection:** Device binding and IP-based token validation
- **API Abuse Prevention:** Request throttling and anomaly detection
- **Data Tampering Prevention:** Request signature validation

#### 1.5 Offline-First Data Handling

**Secure Local Storage:**
- Encrypted SQLite database for offline location data
- Secure queue system for pending API calls
- Automatic sync with authentication when internet reconnects
- Local data encryption with device-specific keys

**Secure Sync Logic:**
- Retrieve unsent location updates from encrypted local storage
- Send to server with renewed JWT authentication when online
- Remove successfully synced data from local queue
- Validate data integrity during sync process
- Log all sync events for audit trail

### 1.6 Service Layer Security

**Secure Service Architecture:**
- **Service File Isolation:** Only service files can directly access Supabase
- **API Route as Gateway:** All client requests must go through API routes
- **Zustand Store Integration:** Both mobile and web use Zustand to call API routes
- **Secure Database Access:** Row Level Security (RLS) policies in Supabase
- **Audit Trail Logging:** All service calls logged with user context

**Security Layers:**
1. **Client Layer:** Zustand stores with secure token management
2. **API Route Layer:** JWT validation and request security
3. **Service Layer:** Business logic with audit logging
4. **Database Layer:** RLS policies and secure access controls
5. **Infrastructure Layer:** Network security and monitoring

### 2. Enhanced Attendance Management

#### 2.1 Client-Side Face Recognition System

**Primary Check-in/out Process:**
1. **Client-side face recognition** (primary method for speed and privacy)
2. **Selfie photo capture** (mandatory for verification + audit storage)
3. **GPS location** (automatically fetched)
4. **Timestamp** (server time)
5. **Complete audit trail** (all actions and decisions logged)

**Enhanced Client-Side Face Recognition Flow:**
- On-device TensorFlow Lite model processes captured photo
- Anti-spoofing liveness detection before face recognition
- Compare with locally stored reference face embedding
- Confidence threshold: >90% for automatic approval
- 70-90% confidence: **RETRY mechanism** - ask user to take better selfie (max 3 attempts)
- <70% after 3 retries: fallback to manual selfie capture with admin verification
- All processing happens on device for privacy and efficiency
- Recognition results (confidence score, processing time) sent to server for audit

**Face Recognition Retry Mechanism:**
```javascript
const faceRecognitionWithRetry = async (salesmanId, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await captureAndRecognizeFace();

    if (result.confidence > 90) {
      return { success: true, confidence: result.confidence, attempt };
    } else if (result.confidence > 70) {
      if (attempt < maxRetries) {
        await showRetryPrompt(attempt, maxRetries, result.confidence);
        continue;
      } else {
        return { success: false, needsManualVerification: true, attempt };
      }
    } else {
      return { success: false, needsManualVerification: true, attempt };
    }
  }
};
```

**Dual Embedding Synchronization:**
- **Server Embedding:** Downloaded and stored securely on device during login
- **Local Embedding:** Generated during onboarding and synced to server
- **Mandatory Match:** Local and server embeddings must match for attendance
- **Sync Validation:** Embeddings validated on each attendance attempt
- **Tamper Detection:** Mismatch detected → attendance blocked immediately

**Server Embedding Validation:**
```javascript
const validateEmbeddingSync = async (salesmanId) => {
  const serverEmbedding = await downloadEmbedding(salesmanId);
  const localEmbedding = getLocalEmbedding(salesmanId);

  const similarity = compareEmbeddings(serverEmbedding, localEmbedding);

  if (similarity < 0.95) {
    // Embeddings don't match - potential tampering
    await blockAttendance('Embedding mismatch detected');
    return false;
  }

  return true;
};
```

**Admin-Controlled Reference Photo Management:**
- **Admin Upload Only:** Reference photos uploaded by admin in dashboard
- **Embedding Generation:** Server generates face embeddings from admin photos
- **Secure Distribution:** Embeddings distributed to devices during login
- **Version Control:** Multiple reference photos with version tracking
- **No Self-Registration:** Salesmen cannot upload their own reference photos

**Admin Reference Photo Workflow:**
```javascript
// Admin uploads reference photo
const uploadReferencePhoto = async (salesmanId, photoFile) => {
  // 1. Validate photo quality and liveness
  const validation = await validatePhotoQuality(photoFile);
  if (!validation.isValid) throw new Error('Invalid photo quality');

  // 2. Generate face embedding on server
  const embedding = await generateFaceEmbedding(photoFile);

  // 3. Store photo in Supabase Storage
  const photoUrl = await uploadPhotoToStorage(salesmanId, photoFile);

  // 4. Update salesman record
  await updateSalesmanEmbedding(salesmanId, embedding, photoUrl);

  // 5. Force device sync on next login
  await markEmbeddingForSync(salesmanId);
};
```

**Anti-Spoofing Protection System:**
- **Liveness Detection:** Eye blink, head movement, and facial expression analysis
- **Digital Photo Detection:** Screen reflection, edge detection, and compression analysis
- **3D Face Detection:** Depth analysis to prevent photo spoofing
- **Motion Analysis:** Random prompts for natural movements
- **Lighting Validation:** Ambient lighting checks to detect screen reflection

**Anti-Spoofing Implementation:**
```javascript
const antiSpoofingCheck = async (cameraStream) => {
  // 1. Liveness detection
  const livenessScore = await detectLiveness(cameraStream);
  if (livenessScore < 0.8) return { valid: false, reason: 'liveness_failed' };

  // 2. Digital photo detection
  const isDigitalPhoto = await detectDigitalPhoto(cameraStream);
  if (isDigitalPhoto) return { valid: false, reason: 'digital_photo_detected' };

  // 3. 3D face validation
  const is3DFace = await validate3DFace(cameraStream);
  if (!is3DFace) return { valid: false, reason: 'not_3d_face' };

  // 4. Random challenge for movement
  await requestRandomMovement(cameraStream);

  return { valid: true };
};
```

**Mandatory Permission Flow:**
```javascript
const mandatoryPermissionCheck = async () => {
  const requiredPermissions = [
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_BACKGROUND_LOCATION',
    'android.permission.WRITE_EXTERNAL_STORAGE'
  ];

  for (const permission of requiredPermissions) {
    const hasPermission = await checkPermission(permission);
    if (!hasPermission) {
      // Show mandatory permission dialog
      const granted = await requestPermission(permission);
      if (!granted) {
        // App cannot function without permissions
        showPermissionRequiredScreen(permission);
        return false;
      }
    }
  }

  return true;
};
```

**Image Storage Policy:**
- **Permanent Storage:** All attendance selfies stored permanently for audit and compliance
- **Reference Photos:** Reference photos kept indefinitely for identity verification
- **Legal Requirements:** 5-7 year retention for HR and legal compliance
- **Dispute Resolution:** Visual evidence available for any attendance disputes
- **Training Data:** Historical images valuable for future ML model improvements
- **Cost Optimization:** Consider archiving older images to cheaper storage after 2 years

**Retention Benefits:**
- Complete audit trail for legal protection
- Evidence for employee disputes or grievances
- Compliance with industry regulations
- Historical data for system improvements
- Reference for HR investigations

**Offline Face Recognition:**
- Complete offline capability with on-device processing
- Queue recognition results for server sync when online
- Maintain local audit trail of all recognition attempts
- Server-side validation of confidence scores when connection restored

#### 2.2 Comprehensive Audit Logging System

**Activity Logging Requirements:**
- Every login/logout action with device info and IP address
- All face recognition attempts with confidence scores and results
- All selfie captures with metadata (time, location, device)
- Location tracking updates with accuracy and battery status
- All failed attempts and error conditions
- Data sync operations and their success/failure status
- Admin actions and modifications to any records

**Audit Data Structure:**
- Timestamps in UTC for all events
- Device information (model, OS version, app version)
- GPS coordinates and accuracy levels
- User actions and system responses
- Error codes and descriptions
- Data modification history with who changed what when

#### 2.3 Attendance Verification Workflow

**Automatic Approval:**
- Face recognition confidence >90%
- Valid GPS location within acceptable parameters
- No suspicious activity detected
- Attendance record automatically approved

**Manual Review Required:**
- Face recognition confidence between 70-90%
- Failed face recognition attempts
- Suspicious location patterns
- Multiple failed check-in attempts
- System flags or anomalies detected

**Admin Verification Interface:**
- Side-by-side comparison of current selfie with reference photo
- Face recognition confidence score display
- Location and time verification
- Attendance history for the user
- Quick approve/reject buttons with comments

**Enhanced Check-in Flow:**
1. Launch camera with face detection overlay
2. Attempt face recognition against stored reference photo
3. If confidence >90%, auto-approve and proceed
4. If confidence <90%, capture high-quality selfie as fallback
5. Get current GPS location automatically with accuracy check
6. Log all attempts, results, and metadata
7. Send complete attendance data to server via API
8. Start 5-minute location tracking service
9. Store data locally if offline
10. Trigger manual verification workflow if confidence <90%

**Enhanced Check-out Flow:**
1. Launch camera with face detection overlay
2. Attempt face recognition against stored reference photo
3. If confidence >90%, auto-approve and proceed
4. If confidence <90%, capture high-quality selfie as fallback
5. Get current GPS location automatically with accuracy check
6. Log all attempts, results, and metadata
7. Send complete attendance data to server via API
8. Stop location tracking service immediately
9. Store data locally if offline
10. Trigger manual verification workflow if confidence <90%

#### 2.2 Authentication System

**Login Options:**
- **First time:** Username + password
- **Subsequent logins:** Biometric fingerprint only

**User Management:**
- Admin creates salesman accounts with user_id and password
- Salespeople use assigned credentials for first login
- Biometric authentication stored locally for convenience

### 3. Enhanced Admin Dashboard

#### 3.1 Real-time Map View

**Simple Polling Approach:**
- Refresh map data every 30 seconds
- No WebSocket complexity
- OpenStreetMap integration (free)

**Map Features:**
- Show all currently checked-in salesmen
- Live location markers
- Basic salesman info on marker click
- Auto-center on current view

#### 3.2 Attendance Verification & Audit Interface

**Manual Verification Queue:**
- List of attendance records requiring manual review
- Face recognition confidence scores displayed
- Side-by-side photo comparison interface
- GPS location verification with map view
- Quick approve/reject actions with comments
- Batch processing for multiple verifications

**Audit Log Viewer:**
- Comprehensive activity log with advanced filtering
- Searchable by salesman, date range, activity type
- Export functionality for compliance reporting
- Detailed event information with metadata
- Timeline view for individual salesman activities
- Suspicious activity alerts and flagging

**Face Recognition Management:**
- Reference photo management for each salesman
- Face recognition accuracy monitoring
- Failed attempt analysis and reporting
- Confidence score distribution analytics
- Model performance tracking and alerts

#### 3.3 Enhanced Salesman Management

**CRUD Operations:**
- Add new salesman (user_id, name, password, reference photo)
- Edit existing salesman details with audit logging
- Delete salesman accounts with compliance checks
- View current status (checked-in/out) with last known location
- Manage face recognition reference photos
- View attendance statistics and compliance metrics

**Enhanced Dashboard View:**
- Total active salesmen with breakdown by status
- Currently checked-in salesmen with location tracking
- Face recognition success rates and accuracy metrics
- Pending verification queue count
- Today's attendance statistics with approval rates
- System health indicators and alerts

#### 3.4 Analytics & Reporting Module

**Attendance Analytics:**
- Daily/weekly/monthly attendance trends
- Face recognition accuracy by individual and overall
- Check-in/check-out time distribution analysis
- Location compliance and tracking accuracy
- Late arrivals and early departures reporting

**Compliance Reporting:**
- Automated attendance reports for HR/payroll
- Audit trail exports for compliance requirements
- Suspicious activity summary reports
- Face recognition failure analysis
- Location tracking gap reporting

**Performance Monitoring:**
- System uptime and response time monitoring
- Face recognition API performance metrics
- Location tracking accuracy and reliability
- Database performance and storage usage
- Mobile app crash reporting and analytics

## Monorepo Project Structure

### Directory Layout
```
kadmawala-tracking/
├── apps/
│   ├── mobile/                 # React Native app
│   │   ├── src/
│   │   │   ├── screens/        # App screens
│   │   │   ├── components/     # UI components
│   │   │   ├── services/       # Local services
│   │   │   ├── hooks/          # Custom hooks
│   │   │   └── store/          # Zustand store
│   │   └── package.json
│   └── web/                    # Next.js admin dashboard
│       ├── src/
│       │   ├── pages/          # Next.js pages
│       │   ├── components/     # React components
│       │   ├── api/            # API routes
│       │   ├── hooks/          # Custom hooks
│       │   └── store/          # Zustand store
│       └── package.json
├── packages/
│   ├── shared/
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # Shared utilities
│   │   ├── constants/          # Shared constants
│   │   └── package.json
│   └── services/               # Service layer
│       ├── supabase/           # Database connection
│       ├── auth/               # Authentication service
│       ├── attendance/         # Attendance service
│       ├── location/           # Location service
│       └── salesman/           # Salesman management service
└── package.json                # Root package.json
```

### Shared Types Package

#### Core Type Definitions

**Shared TypeScript Interfaces:**
- Salesman profile data (id, humanReadableUserId, name, contact info, active status)
- Check-in/out data structures (salesmanId, location, selfie, timestamp, userId)
- Location data format (latitude, longitude, accuracy, timestamp, distanceFromPrevious)
- Path tracking data (pathSegments, distance calculations, movement thresholds)
- Attendance record model (check-in/out times, locations, selfies, userId)
- Location update tracking (salesmanId, coordinates, timestamp, pathSegmentId)
- JWT token structures (access/refresh tokens, claims, expiration)
- Security audit data (security events, authentication attempts, API access)

## Service Layer Architecture

### API Routes Structure

**Secure Next.js API Endpoints:**
- Authentication routes (login, refresh token, logout, biometric verification)
- Attendance management (check-in, check-out, status, verification)
- Location tracking (update location, current locations, path data)
- Salesman management (CRUD operations with audit logging)
- Security management (token validation, security events, rate limiting)
- Audit logging (security logs, access logs, activity logs)

**Secure Service Layer Architecture:**
- Service files handle all database operations with security checks
- API routes with JWT middleware call service functions for business logic
- Shared service layer used by both mobile and web through Zustand stores
- Direct Supabase connections only through service files with RLS policies
- All service calls logged with user context and security audit trails

**Service Layer Architecture:**
- Service files handle all database operations
- API routes call service functions for business logic
- Shared service layer used by both mobile and web
- Direct Supabase connections only through service files

## Supabase Database Schema

### Core Tables

```sql
-- Salesman users table with PGN branding and integrated face recognition
CREATE TABLE salesmen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  human_readable_user_id VARCHAR(20) UNIQUE NOT NULL, -- PGN-2024-0001 format
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,

  -- Face recognition data (stored in same row for simplicity and security)
  face_embedding_data BYTEA, -- Encrypted face embedding vector for server-side validation
  reference_photo_url TEXT NOT NULL, -- Reference selfie for admin verification
  embedding_version VARCHAR(20) DEFAULT '1.0', -- Version of embedding model

  -- Regional assignment
  assigned_regions TEXT[], -- Array of region names/IDs assigned to salesman
  primary_region TEXT, -- Primary region for main operations

  -- Employment status management
  employment_status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, RESIGNED, TERMINATED, ON_LEAVE
  employment_status_reason TEXT, -- Reason for employment status change
  employment_status_changed_at TIMESTAMP WITH TIME ZONE, -- When status was changed
  employment_status_changed_by UUID REFERENCES salesmen(id) ON DELETE SET NULL, -- Admin who changed status
  can_login BOOLEAN DEFAULT true, -- Based on employment status, controls app access

  failed_login_attempts INTEGER DEFAULT 0,
  last_login_at TIMESTAMP WITH TIME ZONE,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  device_info JSONB, -- Track registered devices for security
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Salesman regions management
CREATE TABLE sales_regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_name VARCHAR(100) UNIQUE NOT NULL,
  region_code VARCHAR(20) UNIQUE, -- Short code like HYD, BGLR, MUM
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart daily attendance records with enhanced security and reliability
CREATE TABLE daily_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salesman_id UUID REFERENCES salesmen(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL, -- One record per day per salesman
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_in_latitude DECIMAL(10,8),
  check_in_longitude DECIMAL(11,8),
  check_out_latitude DECIMAL(10,8),
  check_out_longitude DECIMAL(11,8),
  check_in_selfie_url TEXT NOT NULL, -- MANDATORY: Always store selfie for verification
  check_out_selfie_url TEXT, -- MANDATORY if normal check-out
  check_in_face_confidence DECIMAL(5,2), -- Client-side recognition confidence
  check_out_face_confidence DECIMAL(5,2),
  total_work_hours DECIMAL(5,2), -- Calculated total hours
  total_distance_meters DECIMAL(10,2), -- Total distance traveled during day
  verification_status VARCHAR(20) DEFAULT 'pending', -- 'auto_approved', 'manual_approved', 'manual_rejected', 'pending'
  verified_by UUID REFERENCES salesmen(id) ON DELETE SET NULL,
  verification_notes TEXT,
  is_active BOOLEAN DEFAULT true, -- true when checked in, false when checked out

  -- Reliability and failure handling
  check_out_method VARCHAR(20), -- 'manual', 'automatic_timeout', 'battery_dead', 'app_closed'
  check_out_reason TEXT, -- Reason for automatic check-out
  last_location_update TIMESTAMP WITH TIME ZONE, -- Track when last location was received
  battery_level_at_check_in INTEGER, -- Battery level at check-in (%)
  battery_level_at_check_out INTEGER, -- Battery level at check-out (%)
  app_version TEXT, -- App version for compatibility tracking
  device_info JSONB, -- Device information at time of attendance

  -- Path data stored as JSON array of path points with battery info
  path_data JSONB, -- Array of {latitude, longitude, timestamp, distance_from_previous, battery_level}
  path_summary JSONB, -- Summary stats {total_points, segments_count, average_speed, max_speed, min_battery, max_battery}

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one record per salesman per day
  UNIQUE(salesman_id, attendance_date)
);

-- Security events for comprehensive audit logging
CREATE TABLE security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salesman_id UUID REFERENCES salesmen(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- 'login_success', 'login_failed', 'check_in', 'check_out', 'suspicious_activity'
  event_details JSONB NOT NULL, -- Full details of the event
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  success BOOLEAN NOT NULL,
  threat_level INTEGER DEFAULT 0, -- 0=info, 1=warning, 2=critical
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES salesmen(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API request logging for security monitoring (lightweight - can be purged periodically)
CREATE TABLE api_request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salesman_id UUID REFERENCES salesmen(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File storage for all images (selfies, face embeddings, etc.)
CREATE TABLE file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  file_type VARCHAR(20) NOT NULL, -- 'selfie', 'face_embedding', 'reference_photo'
  uploader_id UUID REFERENCES salesmen(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Face recognition attempts for audit (lightweight table)
CREATE TABLE face_recognition_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salesman_id UUID REFERENCES salesmen(id) ON DELETE CASCADE,
  daily_attendance_id UUID REFERENCES daily_attendance(id) ON DELETE CASCADE,
  attempt_type VARCHAR(20) NOT NULL, -- 'check_in' or 'check_out'
  confidence_score DECIMAL(5,2), -- 0-100 percentage from client-side processing
  processing_time_ms INTEGER, -- Client-side processing time
  device_info JSONB, -- Device info for audit
  success BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Robust Check-Out Failure Handling System

### Automatic Check-Out Scenarios

#### 1. App Closure/Background Termination
**Detection:**
- App background service detects app closure
- Heartbeat mechanism missed for >10 minutes
- Android system kills app due to memory or battery optimization

**Automatic Check-Out Process:**
- Use last known location and timestamp
- Mark check-out method as 'app_closed'
- Set check-out reason as "App terminated unexpectedly"
- Calculate work hours based on last known activity
- Create security event for audit trail

#### 2. Battery Drain/Device Shutdown
**Detection:**
- Battery level drops below 5% during tracking
- Device powers off unexpectedly
- Battery removal or system crash

**Automatic Check-Out Process:**
- Use last known GPS location
- Mark check-out method as 'battery_dead'
- Set check-out reason as "Device powered off"
- Record battery level at check-out (from last reading)
- Store emergency location data for audit

#### 3. Network Connectivity Loss
**Detection:**
- No network connection for >30 minutes during work hours
- Unable to sync location data for extended period
- SIM card removal or network issues

**Handling Strategy:**
- Continue tracking and storing data locally
- Do NOT automatically check-out (give benefit of doubt)
- Retry network connection every 5 minutes
- Queue all data for sync when connection restored
- Create security event if offline >2 hours

#### 4. Automatic Timeout Protection
**Detection:**
- Salesman checked in for >16 hours without check-out
- No location updates received for >2 hours during work hours
- Suspicious inactivity patterns

**Timeout Check-Out Process:**
- Automatic check-out after 16-hour maximum work day
- Use last known location for check-out coordinates
- Mark check-out method as 'automatic_timeout'
- Set check-out reason as "Maximum work hours exceeded"
- Flag for admin review with security alert

### Emergency Check-Out Workflow

#### Client-Side Emergency Handling
```javascript
// Emergency check-out scenarios
const emergencyCheckOut = async (reason, lastLocationData) => {
  try {
    // 1. Capture emergency selfie if possible
    const emergencySelfie = await captureEmergencySelfie();

    // 2. Get final GPS location
    const finalLocation = lastLocationData || await getCurrentLocation();

    // 3. Store locally for backup
    await storeEmergencyData({
      checkOutReason: reason,
      location: finalLocation,
      selfie: emergencySelfie,
      batteryLevel: await getBatteryLevel(),
      timestamp: new Date()
    });

    // 4. Try to send to server
    if (isOnline()) {
      await api.emergencyCheckOut({
        reason,
        location: finalLocation,
        selfie: emergencySelfie,
        batteryLevel: await getBatteryLevel()
      });
    }

    // 5. Stop all background services
    await stopLocationTracking();

  } catch (error) {
    // Store emergency data locally for later sync
    await storeEmergencyFallbackData(reason, error);
  }
};
```

#### Server-Side Emergency Processing
```javascript
// Server-side emergency check-out handling
const processEmergencyCheckOut = async (salesmanId, emergencyData) => {
  // 1. Find active attendance record
  const attendanceRecord = await findActiveAttendance(salesmanId);

  // 2. Update with emergency data
  await attendanceRecord.update({
    check_out_time: emergencyData.timestamp,
    check_out_latitude: emergencyData.location.latitude,
    check_out_longitude: emergencyData.location.longitude,
    check_out_selfie_url: emergencyData.selfieUrl,
    check_out_method: emergencyData.reason,
    check_out_reason: getEmergencyReasonDescription(emergencyData.reason),
    battery_level_at_check_out: emergencyData.batteryLevel,
    is_active: false,
    verification_status: 'pending' // Requires admin verification
  });

  // 3. Create security event
  await createSecurityEvent({
    salesmanId,
    eventType: 'emergency_check_out',
    eventDetails: emergencyData,
    threatLevel: getEmergencyThreatLevel(emergencyData.reason)
  });

  // 4. Notify admins for review
  await notifyAdminsForEmergencyCheckout(salesmanId, emergencyData);
};
```

### Battery Level Monitoring & Audit

#### Comprehensive Battery Tracking
- **Check-in Capture:** Battery level recorded at every check-in
- **Location Updates:** Battery level captured every 5 minutes with location
- **Check-out Capture:** Battery level recorded at check-out (manual or automatic)
- **Emergency Recording:** Battery level captured during emergency scenarios

#### Battery Audit Features
- **Battery Drain Analysis:** Track battery consumption patterns during work hours
- **Device Health Monitoring:** Identify devices with battery issues
- **Suspicious Activity Detection:** Alert on unusual battery patterns
- **Compliance Reporting:** Generate battery usage reports for device management

#### Battery Data Structure
```json
{
  "path_data": [
    {
      "latitude": 17.3850,
      "longitude": 78.4867,
      "timestamp": "2025-11-12T10:30:00Z",
      "distance_from_previous": 0,
      "battery_level": 85,
      "charging_status": false
    },
    {
      "latitude": 17.3860,
      "longitude": 78.4877,
      "timestamp": "2025-11-12T10:35:00Z",
      "distance_from_previous": 150,
      "battery_level": 83,
      "charging_status": false
    }
  ],
  "path_summary": {
    "total_points": 50,
    "segments_count": 12,
    "average_speed": 15.5,
    "max_speed": 45.2,
    "min_battery": 15,
    "max_battery": 85,
    "average_battery": 67,
    "battery_drain_rate": 1.4 // % per hour
  }
}
```

### Admin Alert System for Check-Out Failures

#### Real-Time Alerts
- **Emergency Check-Out:** Immediate notification for automatic check-outs
- **Battery Critical:** Alert when battery drops below 10% during work hours
- **Long Inactivity:** Alert when no location updates for >2 hours
- **Device Offline:** Alert when device offline for >30 minutes

#### Alert Escalation
- **Level 1 (Info):** Normal automatic check-outs
- **Level 2 (Warning):** Battery issues, network problems
- **Level 3 (Critical):** Emergency check-outs, suspicious activity
- **Level 4 (Emergency):** Multiple failures, security concerns

### Database Indexes

```sql
-- Optimized indexes for PGN smart schema

-- Salesman indexes
CREATE INDEX idx_salesmen_human_readable_user_id
ON salesmen(human_readable_user_id);

CREATE INDEX idx_salesmen_active_status
ON salesmen(is_active, last_login_at DESC);

CREATE INDEX idx_salesmen_face_embedding
ON salesmen(face_embedding_data) WHERE face_embedding_data IS NOT NULL;

-- Daily attendance indexes (optimized for queries)
CREATE INDEX idx_daily_attendance_salesman_date
ON daily_attendance(salesman_id, attendance_date DESC);

CREATE INDEX idx_daily_attendance_date_active
ON daily_attendance(attendance_date, is_active);

CREATE INDEX idx_daily_attendance_verification_status
ON daily_attendance(verification_status, attendance_date DESC);

CREATE INDEX idx_daily_attendance_checkin_times
ON daily_attendance(check_in_time DESC) WHERE check_in_time IS NOT NULL;

-- Reliability and failure handling indexes
CREATE INDEX idx_daily_attendance_checkout_method
ON daily_attendance(check_out_method, attendance_date DESC);

CREATE INDEX idx_daily_attendance_last_location_update
ON daily_attendance(last_location_update DESC) WHERE is_active = true;

CREATE INDEX idx_daily_attendance_battery_tracking
ON daily_attendance(battery_level_at_check_in, battery_level_at_check_out);

-- Path data JSONB indexes for efficient querying
CREATE INDEX idx_daily_attendance_path_data
ON daily_attendance USING GIN(path_data);

CREATE INDEX idx_daily_attendance_path_summary
ON daily_attendance USING GIN(path_summary);

-- Battery audit JSONB indexes for efficient querying
CREATE INDEX idx_daily_attendance_path_data_battery
ON daily_attendance USING GIN((path_data::jsonb) jsonb_path_ops)
WHERE path_data IS NOT NULL;

-- Security monitoring indexes
CREATE INDEX idx_security_events_salesman_type
ON security_events(salesman_id, event_type, created_at DESC);

CREATE INDEX idx_security_events_threat_level
ON security_events(threat_level, resolved, created_at DESC);

CREATE INDEX idx_security_events_recent
ON security_events(created_at DESC) WHERE threat_level > 0;

-- API request monitoring indexes (lightweight, for security)
CREATE INDEX idx_api_request_logs_recent
ON api_request_logs(created_at DESC);

CREATE INDEX idx_api_request_logs_status
ON api_request_logs(status_code, created_at DESC);

-- Face recognition audit indexes
CREATE INDEX idx_face_recognition_attempts_salesman_attendance
ON face_recognition_attempts(salesman_id, daily_attendance_id, created_at DESC);

CREATE INDEX idx_face_recognition_attempts_confidence
ON face_recognition_attempts(confidence_score DESC, created_at DESC);

-- File upload indexes
CREATE INDEX idx_file_uploads_type_uploader
ON file_uploads(file_type, uploader_id);

CREATE INDEX idx_file_uploads_created_at
ON file_uploads(created_at DESC);

-- Composite indexes for common admin queries
CREATE INDEX idx_daily_attendance_composite_admin
ON daily_attendance(attendance_date DESC, is_active, verification_status);

CREATE INDEX idx_security_events_composite_threat
ON security_events(threat_level DESC, resolved, created_at DESC);
```

## Mobile App Implementation

### Core Screens

#### 1. Login Screen
- Username/Password input fields
- Biometric login option (if previously logged in)
- Login button with loading state

#### 2. Home Screen
- Current status display (Checked-in/Checked-out)
- Check-in/Check-out buttons
- Selfie capture integration
- Location permission handling

#### 3. Settings Screen
- User profile info
- Logout option
- Clear biometric data option

### Background Location Tracking

#### Location Service Implementation
- Background location service configured for 5-minute intervals
- Android background task permissions and configuration
- Automatic start/stop based on check-in/check-out status
- Internet connectivity checking for online/offline handling
- Error handling and retry logic for failed location updates

### Offline Data Storage

#### Local SQLite Database
- Store location updates when device is offline
- Queue attendance records until server connection restored
- Track sync status for each record (synced/pending)
- Maintain data integrity during sync operations

#### Sync Service Logic
- Check internet connectivity before attempting sync
- Upload pending attendance records first (higher priority)
- Sync location updates in batches after attendance data
- Handle failed uploads with retry mechanisms
- Remove successfully synced data from local storage

#### Offline Face Recognition Handling
**Offline Face Recognition Strategy:**
- Store reference photos locally on device for offline face recognition
- Use on-device face recognition library for basic verification
- Queue face recognition results for server-side verification when online
- Capture high-quality selfies even during offline mode
- Store all face recognition attempts locally with confidence scores

**Local Face Recognition Processing:**
- Use TensorFlow Lite or similar on-device ML library
- Pre-process images for consistency (lighting, angle, quality)
- Generate face embeddings for comparison
- Calculate confidence scores locally
- Store processing results for later server validation

**Sync Validation Process:**
- When internet connection restored, re-run face recognition on server
- Compare local confidence scores with server results
- Flag significant discrepancies for admin review
- Update audit logs with both local and server validation results
- Maintain chain of custody for all verification attempts

## Admin Dashboard Implementation

### Core Components

#### 1. Enhanced Real-time Map with Unique Colored Paths
- OpenStreetMap integration with path rendering capabilities
- 30-second polling for location updates with secure authentication
- **Unique colored paths** for each salesman with automatic color assignment
- Real-time path visualization for salesman movement (50m+ segments only)
- Interactive markers showing salesman details with PGN-2024-0001 IDs
- **Path legend** displaying color assignments for all active salesmen
- Path animation showing movement timeline with individual salesman colors
- **Regional overlays** showing assigned region boundaries and compliance
- Distance and duration calculations for each path segment
- Filter options by salesman, region, or time period

#### 2. Comprehensive Salesman Management with Employment Status
- Table view of all salesmen with human-readable user IDs (PGN-2024-0001)
- Add/Edit functionality with audit logging for all changes
- **Employment Status Management:** Professional status tracking (ACTIVE, SUSPENDED, RESIGNED, TERMINATED, ON_LEAVE)
- **Status Change Tracking:** Record reasons and dates for employment status changes
- **Access Control:** Automatic login management based on employment status
- **Data Preservation:** All attendance and tracking data preserved permanently regardless of status
- **Status Change Audit:** Complete log of all employment status changes
- **Region assignment:** Assign single or multiple regions to each salesman
- **Primary region selection:** Set main operational region for each salesman
- **Reference photo upload:** Admin-controlled photo upload with liveness validation
- **Embedding management:** Generate and distribute face embeddings to devices
- Security status indicators (account locked, failed attempts, last login)
- Device management and session monitoring
- Activity history and compliance metrics
- Bulk operations for user management with security validation

#### 2.1 Employment Status Management System
**Employment Status Types:**
- **ACTIVE:** Currently employed, full app access
- **SUSPENDED:** Temporary suspension, no app access
- **RESIGNED:** Employee resigned, no app access
- **TERMINATED:** Employment terminated, no app access
- **ON_LEAVE:** Temporary leave, app access based on policy

**Status-Based Access Control:**
```javascript
// Employment status to can_login mapping
const employmentStatusLoginConfig = {
  'ACTIVE': { canLogin: true },
  'SUSPENDED': { canLogin: false, message: 'Account suspended - contact administrator' },
  'RESIGNED': { canLogin: false, message: 'Employment ended - thank you for your service' },
  'TERMINATED': { canLogin: false, message: 'Employment terminated - contact HR' },
  'ON_LEAVE': { canLogin: true, message: 'Currently on leave' }
};
```

**Employment Status Management Implementation:**
```javascript
// Admin updates employment status
const updateEmploymentStatus = async (salesmanId, newStatus, reason, adminId) => {
  // 1. Update salesman status with audit information
  await updateSalesmanStatus(salesmanId, {
    employment_status: newStatus,
    employment_status_reason: reason,
    employment_status_changed_at: new Date(),
    employment_status_changed_by: adminId,
    can_login: employmentStatusLoginConfig[newStatus].can_login
  });

  // 2. Revoke active tokens if access revoked
  if (!employmentStatusLoginConfig[newStatus].canLogin) {
    await revokeAllUserTokens(salesmanId);
  }

  // 3. Notify user if applicable
  await notifyEmploymentStatusChange(salesmanId, newStatus, reason);
};
```

**User Access Control:**
- **Status-Based Login:** Login access controlled by employment status
- **Automatic Blocking:** Instant app access blocking for terminated users
- **Status Messages:** Clear, professional messages for each status
- **Data Preservation:** All historical data maintained regardless of status
- **Status Change Tracking:** Employment status changes tracked with reasons and timestamps

**Status Change Notifications:**
- **Employee Notifications:** Clear communication about status changes
- **Professional Messaging:** Appropriate messages for each employment situation
- **Contact Information:** Guidance for next steps when applicable
- **Effective Dates:** Clear timelines for status changes```

#### 3. Admin Reference Photo Management System
- **Photo Upload Interface:** Upload high-quality reference photos for each salesman
- **Liveness Detection:** Validate photos to prevent digital photo uploads
- **Quality Control:** Automatic photo quality analysis and validation
- **Embedding Generation:** Server-side face embedding generation from photos
- **Version Control:** Multiple reference photos with version tracking
- **Device Sync Management:** Control embedding distribution to mobile devices
- **Audit Trail:** Complete logging of all photo and embedding changes
- **Bulk Operations:** Upload multiple reference photos simultaneously

#### 4. Region Management Dashboard
- **Region Definition:** Create and manage geographical regions
- **Region Boundaries:** Define GPS coordinates for region boundaries
- **Region Assignment:** Assign salesmen to specific regions
- **Region Visualization:** Display regions on maps for salesman awareness
- **Manual Monitoring:** Admin manually monitors regional activity
- **Simple Analytics:** Basic region-based reports (no automated compliance)
- **Regional Display:** Show assigned regions in mobile app

#### 3. Security Monitoring Dashboard
- **Security Event Timeline:** Real-time monitoring of all security events
- **Threat Level Indicators:** Visual alerts for suspicious activities
- **Failed Login Tracking:** Monitor brute force attempts and account lockouts
- **Device Monitoring:** Track registered devices and unauthorized access attempts
- **API Request Monitoring:** Real-time API usage and performance metrics
- **Geographic Anomaly Detection:** Alert on impossible location changes
- **Session Management:** Active sessions and token management
- **Security Incident Resolution:** Interface to investigate and resolve security events

#### 4. Enhanced Analytics & Compliance
- **Path Analysis Reports:** Movement patterns, distance covered, time spent
- **Attendance Compliance:** Face recognition accuracy and verification rates
- **Security Reports:** Authentication success rates, threat analysis
- **Performance Metrics:** API response times, system health indicators
- **Audit Trail Export:** Complete audit data for compliance requirements
- **User Behavior Analytics:** Login patterns, device usage trends
- **Compliance Dashboard:** Real-time compliance status and alerts

#### 5. Advanced Verification Interface
- **Manual Verification Queue:** Face recognition attempts requiring review
- **Side-by-Side Photo Comparison:** Reference photo vs captured selfie
- **Confidence Score Analysis:** Detailed breakdown of recognition results
- **Location Verification:** GPS location validation with map view
- **Audit Trail Viewer:** Complete history for each attendance record
- **Bulk Verification:** Process multiple verification requests efficiently
- **Verification Analytics:** Success rates and processing time metrics

## Secure Enhanced MVP Development Timeline (5 Weeks)

### Week 1: Security Infrastructure & Core Setup
- **Monorepo Setup:** Configure workspace with shared packages and security policies
- **Supabase Setup:** Create database with RLS policies and security tables
- **JWT Authentication System:** Implement secure token-based authentication
- **API Security Gateway:** Set up route protection and request validation
- **Service Layer Security:** Implement secure service files with audit logging
- **Shared Types:** Define TypeScript interfaces including security types
- **Face Recognition API Integration:** Set up cloud-based face recognition service
- **User ID System:** Implement human-readable user ID generation (PGN-YYYY-NNNN)

### Week 2: Secure Mobile App Features
- **Secure Authentication:** JWT-based login with biometric support and token refresh
- **Path Tracking Implementation:** 50m movement threshold with secure data transmission
- **Face Recognition Integration:** On-device face recognition with secure sync
- **Enhanced Check-in/Check-out:** Face recognition + selfie + GPS + audit logging
- **Secure Background Service:** Encrypted location tracking with JWT authentication
- **Secure Offline Storage:** Encrypted SQLite database with secure sync service
- **Security Features:** Device fingerprinting, certificate pinning, request signing

### Week 3: Secure Admin Dashboard & Security Monitoring
- **Secure Real-time Map:** OpenStreetMap with path tracking and authentication
- **Security Dashboard:** Real-time monitoring of security events and threats
- **Salesman Management:** CRUD operations with comprehensive audit logging
- **Attendance Verification Interface:** Secure manual review queue
- **Security Event Monitoring:** Real-time alerts and incident resolution interface
- **API Request Monitoring:** Performance and security metrics dashboard
- **Session Management:** Active sessions and secure token management

### Week 4: Advanced Security Features & Analytics
- **Comprehensive Security Logging:** Complete audit trail with threat detection
- **Path Analysis & Security:** Movement pattern analysis with anomaly detection
- **Advanced Authentication:** Multi-factor authentication options for admin users
- **Security Reporting:** Automated security compliance reports
- **Threat Detection System:** Machine learning-based anomaly detection
- **Secure API Documentation:** Security best practices and usage guidelines
- **Penetration Testing Tools:** Internal security testing and validation

### Week 5: Security Testing & Secure Deployment
- **Security Penetration Testing:** Comprehensive security audit and testing
- **API Security Testing:** Brute force, injection, and bypass attempts
- **Authentication Security Testing:** Token theft and session hijacking attempts
- **Data Integrity Testing:** Audit log tampering and data consistency validation
- **Performance & Security Testing:** Battery impact with security features
- **Security Documentation:** Complete security configuration and deployment guide
- **Security Training:** Admin security best practices and incident response procedures
- **Secure Deployment:** Production deployment with security monitoring

## Enhanced Technical Decisions

### 1. Smart Architecture Balance
- **No WebSockets:** Polling-based updates (30 seconds for admin dashboard)
- **No Supabase Realtime:** Simple API calls for all data
- **No Complex Geofencing:** Only check-in/out tracking
- **Face Recognition:** Hybrid cloud + on-device approach for reliability
- **Comprehensive Audit:** Complete activity logging for compliance
- **Basic Admin Access:** Simple access control (can be enhanced later)

### 2. Enhanced Data Storage Strategy
- **Permanent Data:** Keep all location, attendance, face recognition, and audit records forever
- **Comprehensive Schema:** Tables for attendance, face recognition, audit logs, file management
- **File Storage:** Supabase Storage for all images (selfies, reference photos)
- **Optimized Indexing:** Performance indexes for audit queries and face recognition lookups
- **Data Integrity:** Foreign key constraints and audit trail maintenance

### 3. Enhanced Mobile App Features
- **Android Only:** Single platform focus
- **Core Screens:** Login, Home, Settings, Reference Photo Capture
- **Background Service:** 5-minute interval tracking with face recognition support
- **Offline First:** Store everything locally with face recognition, sync when online
- **Face Recognition:** Hybrid on-device + cloud processing for reliability

### 4. Face Recognition Implementation
- **Primary Method:** Cloud-based face recognition API for accuracy
- **Fallback Method:** On-device face recognition using TensorFlow Lite
- **Confidence Thresholds:** >90% auto-approve, <90% manual review
- **Reference Photos:** High-quality photos stored locally and on server
- **Audit Trail:** All attempts logged with confidence scores and processing times

### 5. Comprehensive Audit System
- **Complete Logging:** Every action, attempt, and system response recorded
- **Searchable Interface:** Advanced filtering and search capabilities
- **Compliance Reports:** Automated report generation for audits
- **Data Integrity:** Tamper-proof logging with chain of custody
- **Alert System:** Suspicious activity detection and notifications

## Enhanced MVP Success Criteria

### Must-Have Features
✅ Salesman login with username/password + biometric support
✅ Face recognition attendance with confidence scoring
✅ Manual selfie fallback for failed face recognition
✅ Check-in/out with face recognition + selfie + GPS location
✅ Location tracking every 5 minutes when checked in
✅ Offline data storage with face recognition sync validation
✅ Admin can see live map with salesman locations
✅ Admin verification interface for attendance records
✅ Comprehensive audit logging and monitoring
✅ Reference photo management for face recognition
✅ Attendance analytics and compliance reporting
✅ All data stored permanently with complete audit trail

### Performance Requirements
- **Location Updates:** 5-minute intervals when checked in
- **Face Recognition:** <3 seconds processing time
- **Map Refresh:** 30-second polling for admin dashboard
- **Offline Sync:** Automatic sync with validation when connection restored
- **Battery Usage:** Acceptable impact with on-device optimization
- **Audit Queries:** Fast search and filtering performance

## Enhanced Data Privacy & Security (MVP)

### Advanced Security
- **Password Hashing:** Secure storage with bcrypt
- **JWT Tokens:** API authentication with refresh tokens
- **HTTPS:** All API calls encrypted with SSL/TLS
- **Biometric Storage:** Local device storage only (never transmitted)
- **Face Recognition Data:** Encrypted storage of facial templates
- **Audit Log Integrity:** Tamper-proof logging with checksums

### Enhanced Data Handling
- **No User Consent Flow:** Handled by client
- **Permanent Storage:** All data kept indefinitely for audit and compliance
- **Complete Data Preservation:** Raw location, attendance, face recognition attempts
- **Comprehensive Access Control:** Admin roles with audit trail of all actions
- **Chain of Custody:** Full tracking of who accessed/modified what data when

### Face Recognition Security
- **Reference Photo Protection:** Encrypted storage with access logging
- **Processing Privacy:** No facial data shared with third parties beyond recognition service
- **Template Storage:** Secure facial embeddings with proper access controls
- **Fallback Security:** Manual selfie verification maintains system integrity
- **Audit Transparency:** All face recognition attempts logged for compliance

### Compliance & Audit Features
- **Complete Audit Trail:** Every action logged with timestamp and user identification
- **Data Integrity Checks:** Regular validation of audit log completeness
- **Compliance Reports:** Automated generation for regulatory requirements
- **Suspicious Activity Detection:** Automated alerts for unusual patterns
- **Export Capabilities:** Complete data export for legal and compliance needs

## Development Priorities

### Week 1 Focus
1. Monorepo structure with shared types
2. Supabase database and storage setup
3. Basic service layer implementation
4. Next.js API routes for all operations

### Week 2 Focus
1. React Native app with authentication
2. Camera integration for selfie capture
3. Location services for GPS tracking
4. Background service for 5-minute updates

### Week 3 Focus
1. OpenStreetMap integration
2. Real-time location display with polling
3. Salesman management interface
4. Basic dashboard statistics

### Week 4 Focus
1. End-to-end workflow testing
2. Offline synchronization testing
3. Performance optimization
4. Documentation and deployment prep

## Conclusion

This enhanced MVP implementation plan focuses on delivering enterprise-grade functionality while maintaining reliability and comprehensive audit capabilities. The 5-week timeline ensures delivery of a robust system that addresses critical business needs:

- **Face recognition attendance with manual verification fallback**
- **Comprehensive audit logging for complete compliance**
- **Reliable location tracking with offline-first architecture**
- **Advanced admin dashboard with verification interface**
- **Complete data preservation for audit and analysis**
- **Enhanced security and compliance features**

The architecture balances simplicity with enterprise requirements, avoiding unnecessary complexity (no WebSockets) while implementing critical features (face recognition, audit logging). The hybrid face recognition approach ensures reliability in both online and offline scenarios, and the comprehensive audit system provides complete transparency and compliance capabilities.

**Key Enterprise Features:**
- Face recognition with confidence scoring and manual verification
- Complete audit trail for all system activities and modifications
- Reference photo management with secure storage
- Compliance reporting and suspicious activity detection
- Offline face recognition with server-side validation
- Advanced admin verification interface with analytics

**Ready for Development:**
- Enhanced technical specifications with face recognition
- Comprehensive database schema with audit logging
- Detailed component architecture for verification workflows
- 5-week development timeline with testing phases
- Enterprise-grade success criteria and security requirements

The plan now provides a complete enterprise solution that addresses the core business need for reliable attendance tracking while ensuring complete auditability and compliance capabilities that prevent excuses and enable proper workforce management.

**Next Steps:**
1. Review and approve enhanced implementation plan
2. Set up face recognition API service (AWS Rekognition, Azure Face API, or similar)
3. Allocate development resources for 5-week timeline
4. Begin Week 1 development with infrastructure setup
5. Establish regular progress reviews and stakeholder demonstrations