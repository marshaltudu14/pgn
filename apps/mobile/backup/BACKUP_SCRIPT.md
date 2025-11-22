# Backup Script for PGN Location Tracking Service

## ⚠️ IMPORTANT: Automatic Plugin Implementation

**This backup system is now secondary to our Expo config plugin.**

The primary approach uses `plugins/withLocationTrackingService.js` which automatically:
- ✅ Generates all Kotlin files during `expo prebuild`
- ✅ Updates AndroidManifest.xml automatically
- ✅ Survives `expo prebuild --clean`
- ✅ No manual file copying needed

## Manual Backup (Emergency Use Only)

Use these backup files ONLY if the automatic plugin fails or for disaster recovery.

### Source Files Already Backed Up

✅ `LocationTrackingService.kt` - Main foreground service
✅ `LocationDatabaseHelper.kt` - SQLite database helper
✅ `LocationTrackingModule.kt` - React Native bridge
✅ `LocationTrackingPackage.kt` - Module registration

### Emergency Recovery Commands

```bash
# ONLY use if plugin fails and you need manual recovery:
cd apps/mobile

# 1. Run expo prebuild first
npx expo prebuild --clean --platform android

# 2. If plugin fails to generate files, copy from backup:
cp backup/*.kt android/app/src/main/java/com/pgn/mobile/

# 3. Rebuild APK
cd android && ./gradlew assembleDebug
```

## Plugin Configuration (Primary Method)

The plugin is configured in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "./plugins/withLocationTrackingService",
        {
          "packageName": "com.pgn.mobile"
        }
      ]
    ]
  }
}
```

## Updated Implementation Notes

1. **No Boot Receiver for Auto-Respawn** - We don't respawn service after crashes
2. **Simple Crash Recovery** - Just sync offline data on next check-in
3. **No 50m Movement Filter** - Track every 5 minutes regardless
4. **AsyncStorage** - Replaced SecureStore for simplicity
5. **FirstName Only** - Uses user.firstName for notifications

## Testing Commands

```bash
# Test plugin works:
cd apps/mobile
npx expo prebuild --clean --platform android
# Should see: [withLocationTrackingService] Created/copied files

# Verify APK builds:
cd android && ./gradlew assembleDebug

# Install on device:
adb install -r app/build/outputs/apk/debug/app-debug.apk
```