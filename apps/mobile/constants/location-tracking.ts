/**
 * Location Tracking Configuration
 *
 * This file contains all the timing and configuration constants
 * for the location tracking system. Update values here to
 * change behavior across the entire app.
 */

export const LOCATION_TRACKING_CONFIG = {
  // Time interval between location updates in seconds
  UPDATE_INTERVAL_SECONDS: 30,

  // Notification settings
  NOTIFICATION: {
    CHANNEL_ID: 'location-tracking',
    CHANNEL_NAME: 'Location Tracking',
    IMPORTANCE: 'low' as const,
  },
};

// Helper to get milliseconds from seconds
export const UPDATE_INTERVAL_MS = LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS * 1000;