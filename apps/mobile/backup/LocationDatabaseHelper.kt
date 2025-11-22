package com.pgn.mobile

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
        // Drop existing tables and recreate
        db.execSQL("DROP TABLE IF EXISTS $TABLE_LOCATION_UPDATES")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_EMERGENCY_CHECKOUTS")
        onCreate(db)
    }

    // Save location to database
    fun saveLocation(
        employeeId: String,
        latitude: Double,
        longitude: Double,
        accuracy: Float,
        batteryLevel: Int,
        timestamp: Long
    ): Long {
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

    // Save emergency check-out
    fun saveEmergencyCheckOut(
        employeeId: String,
        latitude: Double,
        longitude: Double,
        accuracy: Float,
        batteryLevel: Int,
        checkOutTime: Long,
        reason: String,
        checkOutData: String? = null
    ): Long {
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

    // Get pending locations
    fun getPendingLocations(employeeId: String): List<LocationRecord> {
        val db = readableDatabase
        val locations = mutableListOf<LocationRecord>()

        val cursor = db.query(
            TABLE_LOCATION_UPDATES,
            null,
            "$COLUMN_EMPLOYEE_ID = ? AND $COLUMN_SYNCED = 0",
            arrayOf(employeeId),
            null,
            null,
            "$COLUMN_TIMESTAMP ASC"
        )

        cursor.use {
            while (it.moveToNext()) {
                val location = LocationRecord(
                    id = it.getLong(it.getColumnIndexOrThrow(COLUMN_ID)),
                    employeeId = it.getString(it.getColumnIndexOrThrow(COLUMN_EMPLOYEE_ID)),
                    latitude = it.getDouble(it.getColumnIndexOrThrow(COLUMN_LATITUDE)),
                    longitude = it.getDouble(it.getColumnIndexOrThrow(COLUMN_LONGITUDE)),
                    accuracy = it.getFloat(it.getColumnIndexOrThrow(COLUMN_ACCURACY)),
                    batteryLevel = it.getInt(it.getColumnIndexOrThrow(COLUMN_BATTERY_LEVEL)),
                    timestamp = it.getLong(it.getColumnIndexOrThrow(COLUMN_TIMESTAMP)),
                    synced = it.getInt(it.getColumnIndexOrThrow(COLUMN_SYNCED)) == 1,
                    syncAttempts = it.getInt(it.getColumnIndexOrThrow(COLUMN_SYNC_ATTEMPTS))
                )
                locations.add(location)
            }
        }

        return locations
    }

    // Mark location as synced
    fun markLocationAsSynced(locationId: Long): Boolean {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COLUMN_SYNCED, 1)
        }

        return db.update(TABLE_LOCATION_UPDATES, values, "$COLUMN_ID = ?", arrayOf(locationId.toString())) > 0
    }

    // Clear employee data
    fun clearEmployeeData(employeeId: String): Int {
        val db = writableDatabase
        val locationRows = db.delete(TABLE_LOCATION_UPDATES, "$COLUMN_EMPLOYEE_ID = ?", arrayOf(employeeId))
        val emergencyRows = db.delete(TABLE_EMERGENCY_CHECKOUTS, "$COLUMN_EMPLOYEE_ID = ?", arrayOf(employeeId))
        return locationRows + emergencyRows
    }

    // Get pending check-outs
    fun getPendingCheckOuts(employeeId: String): List<EmergencyCheckoutRecord> {
        val db = readableDatabase
        val checkouts = mutableListOf<EmergencyCheckoutRecord>()

        val cursor = db.query(
            TABLE_EMERGENCY_CHECKOUTS,
            null,
            "$COLUMN_EMPLOYEE_ID = ? AND $COLUMN_SYNCED = 0",
            arrayOf(employeeId),
            null,
            null,
            "$COLUMN_CHECK_OUT_TIME ASC"
        )

        cursor.use {
            while (it.moveToNext()) {
                val checkout = EmergencyCheckoutRecord(
                    id = it.getLong(it.getColumnIndexOrThrow(COLUMN_ID)),
                    employeeId = it.getString(it.getColumnIndexOrThrow(COLUMN_EMPLOYEE_ID)),
                    latitude = it.getDouble(it.getColumnIndexOrThrow(COLUMN_LATITUDE)),
                    longitude = it.getDouble(it.getColumnIndexOrThrow(COLUMN_LONGITUDE)),
                    accuracy = it.getFloat(it.getColumnIndexOrThrow(COLUMN_ACCURACY)),
                    batteryLevel = it.getInt(it.getColumnIndexOrThrow(COLUMN_BATTERY_LEVEL)),
                    checkOutTime = it.getLong(it.getColumnIndexOrThrow(COLUMN_CHECK_OUT_TIME)),
                    reason = it.getString(it.getColumnIndexOrThrow(COLUMN_REASON)),
                    checkOutData = it.getString(it.getColumnIndexOrThrow(COLUMN_CHECK_OUT_DATA)),
                    synced = it.getInt(it.getColumnIndexOrThrow(COLUMN_SYNCED)) == 1,
                    syncAttempts = it.getInt(it.getColumnIndexOrThrow(COLUMN_SYNC_ATTEMPTS))
                )
                checkouts.add(checkout)
            }
        }

        return checkouts
    }
}

// Data classes
data class LocationRecord(
    val id: Long,
    val employeeId: String,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val batteryLevel: Int,
    val timestamp: Long,
    val synced: Boolean,
    val syncAttempts: Int
)

data class EmergencyCheckoutRecord(
    val id: Long,
    val employeeId: String,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val batteryLevel: Int,
    val checkOutTime: Long,
    val reason: String,
    val checkOutData: String?,
    val synced: Boolean,
    val syncAttempts: Int
)