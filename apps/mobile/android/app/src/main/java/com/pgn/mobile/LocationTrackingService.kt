package com.pgn.mobile

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import kotlinx.coroutines.*
import java.util.concurrent.TimeUnit

class LocationTrackingService : Service(), LocationListener {

    private lateinit var locationManager: LocationManager
    private lateinit var notificationManager: NotificationManagerCompat
    private lateinit var batteryManager: BatteryManager
    private lateinit var handler: Handler
    private lateinit var locationTrackingJob: Job

    // Configuration
    companion object {
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "location_tracking_channel"
        const val LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000L // 5 minutes
        const val BATTERY_CHECK_INTERVAL = 30 * 1000L // 30 seconds
        const val SYNC_RETRY_INTERVAL = 2 * 60 * 1000L // 2 minutes

        // Shared preferences keys
        const val PREFS_NAME = "location_tracking_prefs"
        const val KEY_IS_TRACKING = "is_tracking"
        const val KEY_EMPLOYEE_ID = "employee_id"
        const val KEY_EMPLOYEE_NAME = "employee_name"
        const val KEY_CHECK_IN_TIME = "check_in_time"
        const val KEY_LAST_LOCATION_TIME = "last_location_time"

        // Emergency check-out reasons
        const val EMERGENCY_REASON_BATTERY_LOW = "BATTERY_LOW"
        const val EMERGENCY_REASON_APP_CRASHED = "APP_CRASHED"
        const val EMERGENCY_REASON_SERVICE_KILLED = "SERVICE_KILLED"
    }

    // Service state
    private var isTracking = false
    private var employeeId: String? = null
    private var employeeName: String? = null
    private var checkInTime: Long = 0
    private var lastLocation: Location? = null
    private var lastLocationTime: Long = 0
    private var serviceStartTime: Long = 0

    // Database helper
    private lateinit var databaseHelper: LocationDatabaseHelper

    override fun onCreate() {
        super.onCreate()
        initializeService()
        startForeground(NOTIFICATION_ID, createNotification("Starting location tracking...", "Initializing service..."))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "START_TRACKING" -> {
                val empId = intent.getStringExtra("employee_id")
                val empName = intent.getStringExtra("employee_name")
                if (empId != null && empName != null) {
                    startLocationTracking(empId, empName)
                }
            }
            "STOP_TRACKING" -> {
                val checkOutData = intent.getStringExtra("check_out_data")
                stopLocationTracking(checkOutData ?: "USER_CHECKOUT")
            }
            "UPDATE_NOTIFICATION" -> {
                val title = intent.getStringExtra("title")
                val content = intent.getStringExtra("content")
                if (title != null && content != null) {
                    updateNotification(title, content)
                }
            }
            else -> {
                // Service restarted by system
                restoreTrackingState()
            }
        }

        return START_STICKY // Ensure service restarts if killed
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopLocationTracking("SERVICE_DESTROYED")
    }

    private fun initializeService() {
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        notificationManager = NotificationManagerCompat.from(this)
        batteryManager = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        handler = Handler(Looper.getMainLooper())
        databaseHelper = LocationDatabaseHelper(this)
        serviceStartTime = System.currentTimeMillis()

        createNotificationChannel()
        startPeriodicTasks()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "PGN Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Tracks your location during work hours for attendance"
                setShowBadge(false)
                setSound(null, null)
                enableVibration(false)
            }

            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(title: String, content: String): Notification {
        val duration = if (checkInTime > 0) {
            val durationMs = System.currentTimeMillis() - checkInTime
            formatDuration(durationMs)
        } else {
            "Starting..."
        }

        val finalContent = if (content.contains("Active for")) {
            content
        } else {
            "Active for $duration • Last update: ${getTimeAgo(lastLocationTime)}"
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(finalContent)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(title: String? = null, content: String? = null) {
        try {
            val notificationTitle = title ?: "PGN Attendance - ${employeeName ?: "Tracking"}"
            val notificationContent = content ?: generateNotificationContent()

            val notification = createNotification(notificationTitle, notificationContent)
            notificationManager.notify(NOTIFICATION_ID, notification)
        } catch (e: Exception) {
            println("Error updating notification: ${e.message}")
        }
    }

    private fun generateNotificationContent(): String {
        val duration = if (checkInTime > 0) {
            val durationMs = System.currentTimeMillis() - checkInTime
            formatDuration(durationMs)
        } else "0m"

        val batteryLevel = getBatteryLevel()
        val timeAgo = getTimeAgo(lastLocationTime)

        return "Active for $duration • Last update: $timeAgo • Battery: $batteryLevel%"
    }

    private fun startLocationTracking(empId: String, empName: String) {
        if (isTracking) return

        try {
            employeeId = empId
            employeeName = empName
            checkInTime = System.currentTimeMillis()
            isTracking = true

            // Save state
            saveTrackingState()

            // Start location updates
            startLocationUpdates()

            // Start periodic tasks
            startPeriodicTasks()

            updateNotification("PGN Attendance - $empName", "Location tracking started")

            println("Location tracking started for employee: $empId")

        } catch (e: Exception) {
            println("Error starting location tracking: ${e.message}")
            isTracking = false
        }
    }

    private fun startLocationUpdates() {
        try {
            // Check if GPS provider is available
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    LOCATION_UPDATE_INTERVAL,
                    0f, // No distance filter - track every 5 minutes regardless of movement
                    this
                )
            }

            // Also use network provider as backup
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    LOCATION_UPDATE_INTERVAL,
                    0f,
                    this
                )
            }

            println("Location updates started")
        } catch (e: SecurityException) {
            println("Location permission not granted: ${e.message}")
            stopLocationTracking("PERMISSION_DENIED")
        } catch (e: Exception) {
            println("Error starting location updates: ${e.message}")
        }
    }

    private fun startPeriodicTasks() {
        // Battery level monitoring
        handler.postDelayed(object : Runnable {
            override fun run() {
                if (isTracking) {
                    checkBatteryLevel()
                    updateNotification()
                    handler.postDelayed(this, BATTERY_CHECK_INTERVAL)
                }
            }
        }, BATTERY_CHECK_INTERVAL)

        // Periodic sync task
        handler.postDelayed(object : Runnable {
            override fun run() {
                if (isTracking) {
                    syncPendingLocations()
                    handler.postDelayed(this, SYNC_RETRY_INTERVAL)
                }
            }
        }, SYNC_RETRY_INTERVAL)
    }

    private fun checkBatteryLevel() {
        try {
            val batteryLevel = getBatteryLevel()
            if (batteryLevel < 5) {
                // Emergency check-out due to low battery
                performEmergencyCheckOut(EMERGENCY_REASON_BATTERY_LOW)
            }
        } catch (e: Exception) {
            println("Error checking battery level: ${e.message}")
        }
    }

    private fun getBatteryLevel(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        } else {
            // Legacy method
            @Suppress("DEPRECATION")
            val batteryStatus = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            val level = batteryStatus?.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryStatus?.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1) ?: -1
            if (level >= 0 && scale > 0) (level * 100) / scale else 50
        }
    }

    override fun onLocationChanged(location: Location) {
        handleLocationUpdate(location)
    }

    @Suppress("DEPRECATION")
    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {
        // Handle provider status changes if needed
    }

    @Suppress("DEPRECATION")
    override fun onProviderEnabled(provider: String) {
        println("Location provider enabled: $provider")
    }

    @Suppress("DEPRECATION")
    override fun onProviderDisabled(provider: String) {
        println("Location provider disabled: $provider")
    }

    private fun handleLocationUpdate(location: Location) {
        try {
            lastLocation = location
            lastLocationTime = System.currentTimeMillis()

            // Save to local database
            databaseHelper.saveLocation(
                employeeId ?: return,
                location.latitude,
                location.longitude,
                location.accuracy,
                getBatteryLevel(),
                location.time
            )

            // Attempt to sync with server
            syncLocationToServer(location)

            // Update notification
            updateNotification()

            println("Location saved: ${location.latitude}, ${location.longitude}, Battery: ${getBatteryLevel()}%")

        } catch (e: Exception) {
            println("Error handling location update: ${e.message}")
        }
    }

    private fun syncLocationToServer(location: Location) {
        // This will be implemented to communicate with React Native
        // For now, just store locally
        println("Syncing location to server: ${location.latitude}, ${location.longitude}")
    }

    private fun syncPendingLocations() {
        try {
            // Use current employeeId from service state
            val pendingLocations = databaseHelper.getPendingLocations(employeeId ?: "unknown")
            println("Found ${pendingLocations.size} pending locations to sync")

            // This will communicate with React Native to sync with server
            // For now, just mark as attempted

        } catch (e: Exception) {
            println("Error syncing pending locations: ${e.message}")
        }
    }

    private fun performEmergencyCheckOut(reason: String) {
        try {
            println("Performing emergency check-out: $reason")

            val lastKnownLocation = lastLocation
            val checkOutTime = System.currentTimeMillis()

            if (lastKnownLocation != null && employeeId != null) {
                // Save emergency check-out to database
                databaseHelper.saveEmergencyCheckOut(
                    employeeId!!,
                    lastKnownLocation.latitude,
                    lastKnownLocation.longitude,
                    lastKnownLocation.accuracy,
                    getBatteryLevel(),
                    checkOutTime,
                    reason
                )
            }

            stopLocationTracking(reason)

        } catch (e: Exception) {
            println("Error performing emergency check-out: ${e.message}")
        }
    }

    private fun stopLocationTracking(reason: String = "USER_CHECKOUT", checkOutData: String? = null) {
        try {
            isTracking = false

            // Stop location updates
            locationManager.removeUpdates(this)

            // Save final state
            saveTrackingState()

            // Clear tracking data
            clearTrackingState()

            // Update notification
            updateNotification("PGN Attendance - Stopped", "Location tracking stopped")

            // Stop service after delay
            handler.postDelayed({
                stopSelf()
            }, 2000)

            println("Location tracking stopped: $reason")

        } catch (e: Exception) {
            println("Error stopping location tracking: ${e.message}")
        }
    }

    private fun saveTrackingState() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putBoolean(KEY_IS_TRACKING, isTracking)
            putString(KEY_EMPLOYEE_ID, employeeId)
            putString(KEY_EMPLOYEE_NAME, employeeName)
            putLong(KEY_CHECK_IN_TIME, checkInTime)
            putLong(KEY_LAST_LOCATION_TIME, lastLocationTime)
            apply()
        }
    }

    private fun restoreTrackingState() {
        try {
            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val wasTracking = prefs.getBoolean(KEY_IS_TRACKING, false)

            if (wasTracking) {
                employeeId = prefs.getString(KEY_EMPLOYEE_ID, null)
                employeeName = prefs.getString(KEY_EMPLOYEE_NAME, null)
                checkInTime = prefs.getLong(KEY_CHECK_IN_TIME, 0)
                lastLocationTime = prefs.getLong(KEY_LAST_LOCATION_TIME, 0)

                // Check if check-in was recent (within last 24 hours)
                val hoursSinceCheckIn = (System.currentTimeMillis() - checkInTime) / (1000 * 60 * 60)

                if (hoursSinceCheckIn < 24 && employeeId != null && employeeName != null) {
                    // Resume tracking
                    isTracking = true
                    startLocationUpdates()
                    startPeriodicTasks()
                    updateNotification("PGN Attendance - $employeeName", "Service resumed - Active for ${formatDuration(System.currentTimeMillis() - checkInTime)}")
                    println("Tracking service resumed for employee: $employeeId")
                } else {
                    // Too old, clear state
                    clearTrackingState()
                }
            }
        } catch (e: Exception) {
            println("Error restoring tracking state: ${e.message}")
        }
    }

    private fun clearTrackingState() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()

        employeeId = null
        employeeName = null
        checkInTime = 0
        lastLocation = null
        lastLocationTime = 0
        isTracking = false
    }

    private fun formatDuration(durationMs: Long): String {
        val hours = TimeUnit.MILLISECONDS.toHours(durationMs)
        val minutes = TimeUnit.MILLISECONDS.toMinutes(durationMs) % 60

        return when {
            hours > 0 -> "${hours}h ${minutes}m"
            minutes > 0 -> "${minutes}m"
            else -> "< 1m"
        }
    }

    private fun getTimeAgo(timestamp: Long): String {
        if (timestamp == 0L) return "Never"

        val now = System.currentTimeMillis()
        val diffMs = now - timestamp
        val diffMinutes = TimeUnit.MILLISECONDS.toMinutes(diffMs)

        return when {
            diffMinutes < 1 -> "Just now"
            diffMinutes < 60 -> "${diffMinutes}m ago"
            diffMinutes < 1440 -> "${diffMinutes / 60}h ago"
            else -> "${diffMinutes / 1440}d ago"
        }
    }
}