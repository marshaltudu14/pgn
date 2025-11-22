package com.pgn.mobile

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class LocationTrackingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var locationTrackingService: LocationTrackingService? = null

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
            // This would need to be implemented to get actual service status
            // For now, return a basic status object
            val status = Arguments.createMap().apply {
                putBoolean("isRunning", isServiceRunning())
                // Add other status fields as needed
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
            val pendingCheckOuts = databaseHelper.getPendingCheckOuts(employeeId)

            val count = Arguments.createMap().apply {
                putInt("pendingLocations", pendingLocations.size)
                putInt("pendingCheckOuts", pendingCheckOuts.size)
                putInt("totalPending", pendingLocations.size + pendingCheckOuts.size)
            }

            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("GET_PENDING_COUNT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun syncPendingDataForEmployee(employeeId: String, promise: Promise) {
        try {
            val databaseHelper = LocationDatabaseHelper(reactApplicationContext)
            val pendingLocations = databaseHelper.getPendingLocations(employeeId)
            val pendingCheckOuts = databaseHelper.getPendingCheckOuts(employeeId)

            var syncedLocations = 0
            var failedLocations = 0
            var syncedCheckOuts = 0
            var failedCheckOuts = 0

            // Here you would implement the actual sync logic with your server
            // For now, just mark as synced to simulate successful sync
            pendingLocations.forEach { location ->
                try {
                    // TODO: Implement actual server sync
                    val success = databaseHelper.markLocationAsSynced(location.id)
                    if (success) syncedLocations++ else failedLocations++
                } catch (e: Exception) {
                    failedLocations++
                }
            }

            pendingCheckOuts.forEach { checkout ->
                try {
                    // TODO: Implement actual server sync for emergency checkouts
                    val success = databaseHelper.markEmergencyCheckOutAsSynced(checkout.id)
                    if (success) syncedCheckOuts++ else failedCheckOuts++
                } catch (e: Exception) {
                    failedCheckOuts++
                }
            }

            val result = Arguments.createMap().apply {
                putInt("syncedLocations", syncedLocations)
                putInt("failedLocations", failedLocations)
                putInt("syncedCheckOuts", syncedCheckOuts)
                putInt("failedCheckOuts", failedCheckOuts)
                putInt("totalSynced", syncedLocations + syncedCheckOuts)
                putInt("totalFailed", failedLocations + failedCheckOuts)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", e.message)
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
        // This is a basic check - you might want to implement a more sophisticated way
        // to determine if the service is actually running
        return try {
            val activityManager = reactApplicationContext.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            val runningServices = activityManager.getRunningServices(Integer.MAX_VALUE)
            runningServices.any { it.service.className == LocationTrackingService::class.java.name }
        } catch (e: Exception) {
            false
        }
    }

    private fun markEmergencyCheckOutAsSynced(checkOutId: Long): Boolean {
        return try {
            val databaseHelper = LocationDatabaseHelper(reactApplicationContext)
            val db = databaseHelper.writableDatabase
            val values = android.content.ContentValues().apply {
                put("synced", 1)
            }
            db.update("emergency_checkouts", values, "id = ?", arrayOf(checkOutId.toString())) > 0
        } catch (e: Exception) {
            false
        }
    }
}