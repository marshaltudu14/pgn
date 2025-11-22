# PGN Location Tracking Service - Backup and Recovery Guide

## 📁 Overview

This directory contains backup copies of all custom native Android files created for the persistent location tracking service. These files are critical and **cannot be regenerated** without recreating the entire implementation.

## 🚨 CRITICAL: DO NOT DELETE THESE FILES

All files in this directory are **essential** for the location tracking functionality. If they are lost, you'll need to recreate them from this documentation.

## 📋 Files Description

### Android Native Service Files

#### 1. `android/app/src/main/java/com/pgn/mobile/LocationTrackingService.kt`
**Purpose:** Main Android foreground service that persists even when app is closed
**Functionality:**
- Creates persistent notification bar
- Tracks GPS location every 5 minutes
- Handles battery monitoring (emergency check-out at <5%)
- Stores data in SQLite database
- Manages service lifecycle

**Key Features:**
- `START_STICKY` ensures service restarts if killed
- Battery level monitoring with automatic check-out
- Offline data storage and sync
- PGN-branded notification

#### 2. `android/app/src/main/java/com/pgn/mobile/LocationDatabaseHelper.kt`
**Purpose:** SQLite database helper for offline location storage
**Functionality:**
- Creates and manages SQLite database
- Stores location updates and emergency check-outs
- Handles sync status tracking
- Provides cleanup functions

**Database Schema:**
```sql
CREATE TABLE location_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL DEFAULT 0,
    battery_level INTEGER DEFAULT 0,
    timestamp INTEGER NOT NULL,
    synced INTEGER DEFAULT 0,
    sync_attempts INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE emergency_checkouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    battery_level INTEGER DEFAULT 0,
    check_out_time INTEGER NOT NULL,
    reason TEXT NOT NULL,
    synced INTEGER DEFAULT 0,
    sync_attempts INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

#### 3. `android/app/src/main/java/com/pgn/mobile/LocationTrackingModule.kt`
**Purpose:** React Native bridge for native service communication
**Functionality:**
- Exposes native service methods to React Native
- Handles async operations and callbacks
- Manages service lifecycle events

**Key Methods:**
- `startLocationTracking(employeeId, employeeName)`
- `stopLocationTracking(checkOutData)`
- `getServiceStatus()`
- `getPendingLocations(employeeId)`
- `syncPendingDataToServer()`

#### 4. `android/app/src/main/java/com/pgn/mobile/LocationTrackingPackage.kt`
**Purpose:** React Native package registration
**Functionality:**
- Registers LocationTrackingModule with React Native
- Enables communication between JS and native code

#### 5. `android/app/src/main/java/com/pgn/mobile/MainApplication.kt`
**Purpose:** Modified to include LocationTrackingPackage
**Change Made:**
```kotlin
// Added to getPackages() method:
add(LocationTrackingPackage())
```

### React Native Service Files

#### 6. `services/location-foreground-service.ts`
**Purpose:** TypeScript wrapper for native service
**Functionality:**
- Provides clean TypeScript interface for native service
- Handles error cases and type conversion
- Manages service state and events

#### 7. `plugins/withLocationTrackingService.js`
**Purpose:** Expo plugin for prebuild safety
**Functionality:**
- Automatically adds service declarations to AndroidManifest.xml
- Ensures files survive `expo prebuild --clean`
- Manages Android permissions and service configuration

### Store Integration Files

#### 8. `store/attendance-store.ts`
**Purpose:** Updated Zustand store using native service
**Changes Made:**
- Replaced expo-location with native service calls
- Added new state fields for native service
- Implemented sync and cleanup methods
- Removed 50-meter movement filter (tracks every 5 minutes regardless)
- **Crash Recovery:** Automatic sync of offline data on check-in, then clear local storage
- **First Name Only:** Uses `user.firstName` instead of full name for notifications
- **AsyncStorage:** Replaced SecureStore with AsyncStorage for simplicity

## 🔄 Recovery Instructions

### If Files Are Lost or Corrupted

Follow these steps to recover the location tracking service:

### Step 1: Restore Android Native Files

```bash
# Navigate to your project root
cd apps/mobile

# Create Android directories if they don't exist
mkdir -p android/app/src/main/java/com/pgn/mobile

# Copy backup files to their correct locations
cp backup/LocationTrackingService.kt android/app/src/main/java/com/pgn/mobile/
cp backup/LocationDatabaseHelper.kt android/app/src/main/java/com/pgn/mobile/
cp backup/LocationTrackingModule.kt android/app/src/main/java/com/pgn/mobile/
cp backup/LocationTrackingPackage.kt android/app/src/main/java/com/pgn/mobile/
cp backup/MainApplication.kt android/app/src/main/java/com/pgn/mobile/
```

### Step 2: Restore React Native Files

```bash
# Copy React Native service files
cp backup/location-foreground-service.ts services/
cp backup/withLocationTrackingService.js plugins/
```

### Step 3: Update app.json

Ensure your app.json includes the plugin:
```json
{
  "plugins": [
    // ... other plugins
    [
      "./plugins/withLocationTrackingService",
      {
        "packageName": "com.pgn.mobile"
      }
    ]
  ]
}
```

### Step 4: Update Auth Types

Ensure the `AuthenticatedUser` interface in `packages/shared/src/types/auth.ts` includes:
```typescript
export interface AuthenticatedUser {
  // ... other fields
  firstName: string; // First name only for notifications
  // ... other fields
}
```

### Step 5: Understand Crash Handling Approach

**IMPORTANT:** This implementation uses a simple crash recovery approach:

#### No Service Respawn After Crashes
- If the app crashes or service stops, **DO NOT respawn tracking automatically**
- This prevents unfair advantages where employees could manipulate the system

#### Simple Offline Sync on Next Check-In
1. **Data Stored Offline:** Location data continues to be stored in local SQLite if device is offline
2. **Sync on Next Check-In:** When employee opens app and checks in next time:
   - Automatically sync any pending offline data to server
   - Clear local storage for fresh check-in session
3. **No Emergency Check-Out for Crashes:** Unlike battery emergency (<5%), crashes don't trigger emergency check-out

#### Battery Emergency (Different from App Crashes)
- **Battery <5%:** Triggers automatic emergency check-out with last known location
- **App Crash/SERVICE_KILLED:** Just stores data offline, syncs on next check-in

#### Auth Token Storage
- **AsyncStorage:** Uses AsyncStorage instead of SecureStore for simplicity
- **Token Key:** `auth_token` stored in AsyncStorage

### Step 6: Update Attendance Store

Replace the attendance-store.ts imports and methods with the backup version.

### Step 7: Run Expo Prebuild

```bash
npx expo prebuild --clean
```

## 🧪 Testing After Recovery

### 1. Verify Build
```bash
cd apps/mobile
npx expo prebuild --clean
```

### 2. Check Native Compilation
```bash
cd android && ./gradlew assembleDebug
```

### 3. Test Functionality
- Check-in should show persistent notification
- Location tracking should work every 5 minutes
- App closure should not stop tracking
- Emergency check-out should work at <5% battery

## ⚡ Quick Copy-Paste Recovery Commands

If you need to quickly restore all files:

```bash
# Restore all files at once
cd apps/mobile

# Android files
cp backup/*.kt android/app/src/main/java/com/pgn/mobile/

# React Native files
cp backup/location-foreground-service.ts services/
cp backup/withLocationTrackingService.js plugins/

# Prebuild
npx expo prebuild --clean
```

## 📱 How to Verify Everything Works

1. **Persistent Notification:** Check-in should show "PGN Attendance - EmployeeName • Active for Xh Ym • Battery: Z%"
2. **Service Persistence:** Close app and reopen - notification should remain
3. **Location Tracking:** Verify locations are stored in SQLite every 5 minutes
4. **Battery Emergency:** Battery <5% should trigger automatic check-out
5. **Offline Sync:** Turn off network, track locations, turn on network - should auto-sync

## 🔧 File Dependencies

All files work together and have interdependencies:

- `LocationTrackingService` requires `LocationDatabaseHelper`
- `LocationTrackingModule` requires `LocationTrackingService`
- `LocationTrackingPackage` registers `LocationTrackingModule`
- `MainApplication` must include `LocationTrackingPackage`
- React Native service requires native module to be available
- Store integration requires all of the above

## 💡 Important Notes

- **Always test after recovery** - don't assume files work without verification
- **Check permissions** - ensure foreground service permissions are granted
- **Monitor battery** - service should be optimized for battery usage
- **Test offline scenarios** - verify sync functionality works reliably

## 🆘 Emergency Contact

If you encounter issues during recovery or need help with the implementation, refer to this documentation or recreate the files using the detailed specifications provided.