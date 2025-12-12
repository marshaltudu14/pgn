# Building Production APK for PGN Mobile App

## Prerequisites

1. Node.js 18+ installed
2. Android Studio or Android SDK installed
3. ADB (Android Debug Bridge) installed and configured
4. Physical Android device or Android emulator running

## Build Process

### 1. Fix TypeScript and ESLint Issues

```bash
# Run checks for web app
cd apps/web && npx tsc --noEmit && npm run lint

# Run checks for mobile app
cd apps/mobile && npx tsc --noEmit && npm run lint
```

### 2. Fix Monorepo Metro Bundler Issue

The main issue with building APK in a monorepo is that Metro bundler looks for index.js from the wrong directory. The solution is to create a redirect index.js at the monorepo root:

```javascript
// Create file: C:\Code\pgn\index.js
// Workaround for Expo CLI monorepo issue
// Redirect to actual mobile app entry
export { default } from './apps/mobile/index.js';
```

### 3. Run Prebuild (if needed)

```bash
cd apps/mobile && npx expo prebuild
```

### 4. Build Production APK

#### Method 1: Using Gradle directly (Recommended)

```bash
# On Windows
cd apps/mobile/android
set NODE_ENV=production
.\gradlew.bat assembleRelease
```

#### Method 2: Using npm script

```bash
cd apps/mobile
npm run android:build
```

## Build Output

The APK will be generated at:
```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

## Common Issues and Solutions

### Issue: Metro bundler cannot find index.js

**Error**: `Error: Unable to resolve module ./index.js from C:\Code\pgn\.:`

**Solution**: Create an index.js file at the monorepo root that redirects to the mobile app's index.js.

### Issue: NODE_ENV not set

**Error**: `The NODE_ENV environment variable is required but was not specified`

**Solution**: Set NODE_ENV=production before building:
- Windows: `set NODE_ENV=production`
- Linux/Mac: `export NODE_ENV=production`

### Issue: TypeScript errors

**Solution**: Fix TypeScript errors by running `npx tsc --noEmit` and addressing all type errors before building.

## Installing the APK

### 1. Enable Developer Options on Android Device

1. Go to Settings > About phone
2. Tap on "Build number" 7 times
3. Go back to Settings > System > Developer options
4. Enable "USB debugging"

### 2. Connect Device

```bash
# Check if device is connected
adb devices

# Install the APK
adb install apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

### 3. Verify Installation

```bash
# List installed apps to verify
adb shell pm list packages | grep pgn
```

## Build Configuration Details

- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 36 (Android 14)
- **Compile SDK**: 36
- **Kotlin Version**: 2.1.20
- **Gradle Version**: 8.14.3
- **Expo SDK**: 54

## Notes

1. The build process uses React Native's new architecture by default
2. Hermes JavaScript engine is enabled for better performance
3. The APK is signed with debug keystore by default
4. For production distribution, create and configure a production keystore

## Clean Build

If you encounter issues, clean the build:

```bash
# Clean Gradle cache
cd apps/mobile/android && .\gradlew.bat clean

# Clear Metro bundler cache
cd apps/mobile && npx expo start --clear

# Re-run build
cd apps/mobile/android && set NODE_ENV=production && .\gradlew.bat assembleRelease
```