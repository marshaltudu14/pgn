const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo plugin to add location tracking foreground service
 * Ensures native files are properly added during expo prebuild
 */
function withLocationTrackingService(config, options = {}) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Get the main application node
    const application = androidManifest.manifest.application[0];
    if (!application) {
      return config;
    }

    // Ensure services array exists
    if (!application.service) {
      application.service = [];
    }

    // Add our location tracking service
    const locationService = {
      $: {
        'android:name': '.LocationTrackingService',
        'android:foregroundServiceType': 'location',
        'android:exported': 'false',
      },
    };

    // Check if service already exists
    const serviceExists = application.service.some(
      (service) => service.$['android:name'] === '.LocationTrackingService'
    );

    if (!serviceExists) {
      application.service.push(locationService);
      console.log('[withLocationTrackingService] Added LocationTrackingService to AndroidManifest.xml');
    }

    // Add boot receiver for cleanup and sync after device restart (not for respawn)
    if (!application.receiver) {
      application.receiver = [];
    }

    const bootReceiver = {
      $: {
        'android:name': '.BootReceiver',
        'android:enabled': 'true',
        'android:exported': 'false',
      },
      'intent-filter': [{
        action: [{
          $: {
            'android:name': 'android.intent.action.BOOT_COMPLETED',
          },
        }],
      }],
    };

    const receiverExists = application.receiver.some(
      (receiver) => receiver.$['android:name'] === '.BootReceiver'
    );

    if (!receiverExists) {
      application.receiver.push(bootReceiver);
      console.log('[withLocationTrackingService] Added BootReceiver to AndroidManifest.xml');
    }

    return config;
  });
}

/**
 * Copy Kotlin service files to generated Android directory
 */
function copyKotlinFiles(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const androidProjectPath = config.modRequest.projectRoot;
      const javaDir = path.join(androidProjectPath, 'android', 'app', 'src', 'main', 'java', 'com', 'pgn', 'mobile');
      const backupDir = path.join(androidProjectPath, 'backup');

      console.log('[withLocationTrackingService] Copying Kotlin files to:', javaDir);

      // Ensure directory exists
      if (!fs.existsSync(javaDir)) {
        fs.mkdirSync(javaDir, { recursive: true });
      }

      // Copy LocationTrackingService from backup if exists, otherwise create it
      const serviceSourcePath = path.join(backupDir, 'LocationTrackingService.kt');
      const serviceDestPath = path.join(javaDir, 'LocationTrackingService.kt');

      if (fs.existsSync(serviceSourcePath)) {
        fs.copyFileSync(serviceSourcePath, serviceDestPath);
        console.log('[withLocationTrackingService] Copied LocationTrackingService.kt');
      }

      // Create other required Kotlin files automatically
      createKotlinFile(javaDir, 'LocationDatabaseHelper.kt', getLocationDatabaseHelperCode());
      createKotlinFile(javaDir, 'LocationTrackingModule.kt', getLocationTrackingModuleCode());
      createKotlinFile(javaDir, 'LocationTrackingPackage.kt', getLocationTrackingPackageCode());

      return config;
    },
  ]);
}

/**
 * Main plugin function
 */
module.exports = function withLocationTracking(config, options = {}) {
  config = withLocationTrackingService(config, options);
  config = copyKotlinFiles(config);
  return config;
};

/**
 * Copy service files to android directory
 */
function copyServiceFiles(androidProjectPath) {
  try {
    const javaDir = path.join(androidProjectPath, 'app', 'src', 'main', 'java', 'com', 'pgn', 'mobile');

    // Ensure directory exists
    if (!fs.existsSync(javaDir)) {
      fs.mkdirSync(javaDir, { recursive: true });
    }

    console.log('[withLocationTrackingService] Java directory:', javaDir);

    // Copy service files will be handled by the build process
    // Files will be generated during prebuild

    return true;
  } catch (error) {
    console.error('[withLocationTrackingService] Failed to copy service files:', error);
    return false;
  }
}

/**
 * Helper function to create Kotlin files
 */
function createKotlinFile(directory, filename, content) {
  const filePath = path.join(directory, filename);
  fs.writeFileSync(filePath, content);
  console.log(`[withLocationTrackingService] Created ${filename}`);
}

/**
 * Get LocationDatabaseHelper Kotlin code
 */
function getLocationDatabaseHelperCode() {
  return `package com.pgn.mobile

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class LocationDatabaseHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val DATABASE_NAME = "location_tracking.db"
        private const val DATABASE_VERSION = 1

        // Table names
        const val TABLE_LOCATION_UPDATES = "location_updates"
        const val TABLE_EMERGENCY_CHECKOUTS = "emergency_checkouts"

        // Common columns
        const val COLUMN_ID = "id"
        const val COLUMN_EMPLOYEE_ID = "employee_id"
        const val COLUMN_LATITUDE = "latitude"
        const val COLUMN_LONGITUDE = "longitude"
        const val COLUMN_ACCURACY = "accuracy"
        const val COLUMN_BATTERY_LEVEL = "battery_level"
        const val COLUMN_TIMESTAMP = "timestamp"
        const val COLUMN_SYNCED = "synced"
        const val COLUMN_SYNC_ATTEMPTS = "sync_attempts"
        const val COLUMN_CREATED_AT = "created_at"

        // Emergency checkout specific columns
        const val COLUMN_CHECK_OUT_TIME = "check_out_time"
        const val COLUMN_REASON = "reason"
        const val COLUMN_CHECK_OUT_DATA = "check_out_data"
    }

    override fun onCreate(db: SQLiteDatabase) {
        // Create location updates table
        val createLocationTable = """
            CREATE TABLE $TABLE_LOCATION_UPDATES (
                $COLUMN_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COLUMN_EMPLOYEE_ID TEXT NOT NULL,
                $COLUMN_LATITUDE REAL NOT NULL,
                $COLUMN_LONGITUDE REAL NOT NULL,
                $COLUMN_ACCURACY REAL DEFAULT 0,
                $COLUMN_BATTERY_LEVEL INTEGER DEFAULT 0,
                $COLUMN_TIMESTAMP INTEGER NOT NULL,
                $COLUMN_SYNCED INTEGER DEFAULT 0,
                $COLUMN_SYNC_ATTEMPTS INTEGER DEFAULT 0,
                $COLUMN_CREATED_AT INTEGER DEFAULT (strftime('%s', 'now'))
            );
        """.trimIndent()

        db.execSQL(createLocationTable)

        // Create emergency checkouts table
        val createEmergencyTable = """
            CREATE TABLE $TABLE_EMERGENCY_CHECKOUTS (
                $COLUMN_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COLUMN_EMPLOYEE_ID TEXT NOT NULL,
                $COLUMN_LATITUDE REAL NOT NULL,
                $COLUMN_LONGITUDE REAL NOT NULL,
                $COLUMN_ACCURACY REAL DEFAULT 0,
                $COLUMN_BATTERY_LEVEL INTEGER DEFAULT 0,
                $COLUMN_CHECK_OUT_TIME INTEGER NOT NULL,
                $COLUMN_REASON TEXT NOT NULL,
                $COLUMN_CHECK_OUT_DATA TEXT,
                $COLUMN_SYNCED INTEGER DEFAULT 0,
                $COLUMN_SYNC_ATTEMPTS INTEGER DEFAULT 0,
                $COLUMN_CREATED_AT INTEGER DEFAULT (strftime('%s', 'now'))
            );
        """.trimIndent()

        db.execSQL(createEmergencyTable)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_LOCATION_UPDATES")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_EMERGENCY_CHECKOUTS")
        onCreate(db)
    }

    fun saveLocation(employeeId: String, latitude: Double, longitude: Double, accuracy: Float, batteryLevel: Int, timestamp: Long): Long {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COLUMN_EMPLOYEE_ID, employeeId)
            put(COLUMN_LATITUDE, latitude)
            put(COLUMN_LONGITUDE, longitude)
            put(COLUMN_ACCURACY, accuracy)
            put(COLUMN_BATTERY_LEVEL, batteryLevel)
            put(COLUMN_TIMESTAMP, timestamp)
            put(COLUMN_SYNCED, 0)
            put(COLUMN_SYNC_ATTEMPTS, 0)
        }
        return db.insert(TABLE_LOCATION_UPDATES, null, values)
    }

    fun saveEmergencyCheckOut(employeeId: String, latitude: Double, longitude: Double, accuracy: Float, batteryLevel: Int, checkOutTime: Long, reason: String, checkOutData: String? = null): Long {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COLUMN_EMPLOYEE_ID, employeeId)
            put(COLUMN_LATITUDE, latitude)
            put(COLUMN_LONGITUDE, longitude)
            put(COLUMN_ACCURACY, accuracy)
            put(COLUMN_BATTERY_LEVEL, batteryLevel)
            put(COLUMN_CHECK_OUT_TIME, checkOutTime)
            put(COLUMN_REASON, reason)
            put(COLUMN_CHECK_OUT_DATA, checkOutData)
            put(COLUMN_SYNCED, 0)
            put(COLUMN_SYNC_ATTEMPTS, 0)
        }
        return db.insert(TABLE_EMERGENCY_CHECKOUTS, null, values)
    }

    fun getPendingLocations(employeeId: String): List<Map<String, Any>> {
        val db = readableDatabase
        val locations = mutableListOf<Map<String, Any>>()

        val cursor = db.query(TABLE_LOCATION_UPDATES, null, "$COLUMN_EMPLOYEE_ID = ? AND $COLUMN_SYNCED = 0", arrayOf(employeeId), null, null, "$COLUMN_TIMESTAMP ASC")

        cursor.use {
            while (it.moveToNext()) {
                val location = mapOf(
                    "id" to it.getLong(it.getColumnIndexOrThrow(COLUMN_ID)),
                    "employeeId" to it.getString(it.getColumnIndexOrThrow(COLUMN_EMPLOYEE_ID)),
                    "latitude" to it.getDouble(it.getColumnIndexOrThrow(COLUMN_LATITUDE)),
                    "longitude" to it.getDouble(it.getColumnIndexOrThrow(COLUMN_LONGITUDE)),
                    "accuracy" to it.getFloat(it.getColumnIndexOrThrow(COLUMN_ACCURACY)),
                    "batteryLevel" to it.getInt(it.getColumnIndexOrThrow(COLUMN_BATTERY_LEVEL)),
                    "timestamp" to it.getLong(it.getColumnIndexOrThrow(COLUMN_TIMESTAMP)),
                    "synced" to (it.getInt(it.getColumnIndexOrThrow(COLUMN_SYNCED)) == 1),
                    "syncAttempts" to it.getInt(it.getColumnIndexOrThrow(COLUMN_SYNC_ATTEMPTS))
                )
                locations.add(location)
            }
        }
        return locations
    }

    fun markLocationAsSynced(locationId: Long): Boolean {
        val db = writableDatabase
        val values = ContentValues().apply { put(COLUMN_SYNCED, 1) }
        return db.update(TABLE_LOCATION_UPDATES, values, "$COLUMN_ID = ?", arrayOf(locationId.toString())) > 0
    }

    fun clearEmployeeData(employeeId: String): Int {
        val db = writableDatabase
        val locationRows = db.delete(TABLE_LOCATION_UPDATES, "$COLUMN_EMPLOYEE_ID = ?", arrayOf(employeeId))
        val emergencyRows = db.delete(TABLE_EMERGENCY_CHECKOUTS, "$COLUMN_EMPLOYEE_ID = ?", arrayOf(employeeId))
        return locationRows + emergencyRows
    }
}`;
}

function getLocationTrackingModuleCode() {
  return `package com.pgn.mobile

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class LocationTrackingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "LocationTrackingModule"
    }

    @ReactMethod
    fun startTracking(employeeId: String, employeeName: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = android.content.Intent(context, LocationTrackingService::class.java).apply {
                action = "START_TRACKING"
                putExtra("employee_id", employeeId)
                putExtra("employee_name", employeeName)
            }

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_TRACKING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopTracking(checkOutData: String?, promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = android.content.Intent(context, LocationTrackingService::class.java).apply {
                action = "STOP_TRACKING"
                checkOutData?.let { putExtra("check_out_data", it) }
            }

            context.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_TRACKING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getServiceStatus(promise: Promise) {
        try {
            val status = Arguments.createMap().apply {
                putBoolean("isRunning", isServiceRunning())
            }
            promise.resolve(status)
        } catch (e: Exception) {
            promise.reject("GET_STATUS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getPendingLocationCount(employeeId: String, promise: Promise) {
        try {
            val databaseHelper = LocationDatabaseHelper(reactApplicationContext)
            val pendingLocations = databaseHelper.getPendingLocations(employeeId)

            val count = Arguments.createMap().apply {
                putInt("pendingLocations", pendingLocations.size)
                putInt("pendingCheckOuts", 0)
                putInt("totalPending", pendingLocations.size)
            }

            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("GET_PENDING_COUNT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun clearEmployeeData(employeeId: String, promise: Promise) {
        try {
            val databaseHelper = LocationDatabaseHelper(reactApplicationContext)
            val clearedRows = databaseHelper.clearEmployeeData(employeeId)
            promise.resolve(clearedRows)
        } catch (e: Exception) {
            promise.reject("CLEAR_DATA_ERROR", e.message)
        }
    }

    private fun isServiceRunning(): Boolean {
        return try {
            val activityManager = reactApplicationContext.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            val runningServices = activityManager.getRunningServices(Integer.MAX_VALUE)
            runningServices.any { it.service.className == LocationTrackingService::class.java.name }
        } catch (e: Exception) {
            false
        }
    }
}`;
}

function getLocationTrackingPackageCode() {
  return `package com.pgn.mobile

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class LocationTrackingPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(LocationTrackingModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}`;
}

module.exports.copyServiceFiles = copyServiceFiles;