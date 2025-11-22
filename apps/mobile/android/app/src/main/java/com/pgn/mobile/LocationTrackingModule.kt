package com.pgn.mobile

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
}