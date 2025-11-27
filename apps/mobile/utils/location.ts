import * as Location from 'expo-location';
import { permissionService } from '@/services/permissions';
import { COLORS } from '@/constants';
import { showToast } from '@/utils/toast';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  address?: string;
}

export interface LocationTrackingOptions {
  accuracy?: Location.Accuracy;
  timeInterval?: number;
  distanceInterval?: number;
  showsBackgroundLocationIndicator?: boolean;
  foregroundService?: Location.LocationTaskOptions['foregroundService'];
  activityType?: Location.ActivityType;
}

export interface LocationAccuracyLevel {
  level: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY POOR';
  color: string;
  description: string;
}

/**
 * Location utility functions for GPS functionality and background tracking
 */

// Request location permissions
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const hasPermission = await permissionService.requestLocationPermission();
    return hasPermission === 'granted';
  } catch (error) {
    console.error('Failed to request location permission:', error);
    return false;
  }
}

// Check if location services are available and have permissions
export async function isLocationAvailable(): Promise<boolean> {
  try {
    const hasPermission = await permissionService.checkLocationPermission();
    if (hasPermission !== 'granted') {
      return false;
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking location availability:', error);
    return false;
  }
}

// Get current location with specified accuracy
export async function getCurrentLocation(
  accuracy: Location.Accuracy = Location.Accuracy.High
): Promise<LocationData> {
  try {
    // Check permission first (don't request - just check, since AuthGuard already ensures permissions)
    const hasPermission = await permissionService.checkLocationPermission();
    if (hasPermission !== 'granted') {
      throw new Error('Location permission is required');
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      throw new Error('Location services are disabled');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy,
    });

    return formatLocationData(location);

  } catch (error) {
    console.error('Failed to get current location:', error);
    throw new Error(`Failed to get current location: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Start background location tracking
export async function startLocationTracking(
  options: LocationTrackingOptions = {},
  onUpdate?: (location: LocationData) => void
): Promise<Location.LocationSubscription> {
  try {
    const hasPermission = await permissionService.checkLocationPermission();
    if (hasPermission !== 'granted') {
      throw new Error('Location permission is required for tracking');
    }

    // Configure tracking options
    const trackingOptions: Location.LocationTaskOptions = {
      accuracy: options.accuracy || Location.Accuracy.Balanced,
      timeInterval: options.timeInterval || 5 * 60 * 1000, // 5 minutes
      distanceInterval: options.distanceInterval || 0, // No distance filter
      showsBackgroundLocationIndicator: options.showsBackgroundLocationIndicator !== false,
      foregroundService: options.foregroundService,
      // Don't pause tracking when app is in background
      pausesUpdatesAutomatically: false,
    };

    // Start tracking
    const locationWatcher = await Location.watchPositionAsync(
      trackingOptions,
      (location) => {
        const formattedLocation = formatLocationData(location);
        if (onUpdate) {
          onUpdate(formattedLocation);
        }
      }
    );

    return locationWatcher;

  } catch (error) {
    console.error('Failed to start location tracking:', error);
    throw new Error(`Failed to start location tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Stop background location tracking
export async function stopLocationTracking(
  locationWatcher: Location.LocationSubscription | null
): Promise<void> {
  try {
    if (locationWatcher) {
      await locationWatcher.remove();
    }
  } catch (error) {
    console.error('Failed to stop location tracking:', error);
  }
}

// Calculate distance between two GPS coordinates in meters
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Check if movement exceeds threshold (50 meters default)
export function hasSignificantMovement(
  previousLocation: LocationData,
  currentLocation: LocationData,
  threshold: number = 50
): boolean {
  const distance = calculateDistance(
    previousLocation.latitude,
    previousLocation.longitude,
    currentLocation.latitude,
    currentLocation.longitude
  );

  return distance >= threshold;
}

// Get GPS accuracy level description
export function getAccuracyLevel(accuracy: number): LocationAccuracyLevel {
  if (accuracy <= 5) {
    return {
      level: 'EXCELLENT',
      color: '#10B981', // green
      description: 'Very accurate location (±5m)'
    };
  } else if (accuracy <= 10) {
    return {
      level: 'GOOD',
      color: '#3B82F6', // blue
      description: 'Good location accuracy (±10m)'
    };
  } else if (accuracy <= 20) {
    return {
      level: 'FAIR',
      color: COLORS.WARNING,
      description: 'Fair location accuracy (±20m)'
    };
  } else if (accuracy <= 50) {
    return {
      level: 'POOR',
      color: '#EF4444', // red
      description: 'Poor location accuracy (±50m)'
    };
  } else {
    return {
      level: 'VERY POOR',
      color: '#7C3AED', // purple
      description: 'Very poor location accuracy (>±50m)'
    };
  }
}

// Format coordinates for display
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Request user to enable location services
export async function promptEnableLocationServices(): Promise<void> {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      showToast.error('Location services are disabled. Please enable location services in your device settings to use this feature.');
    }
  } catch (error) {
    console.error('Failed to prompt for location services:', error);
  }
}

// Format location data from expo-location
function formatLocationData(location: Location.LocationObject): LocationData {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy || 0,
    altitude: location.coords.altitude || undefined,
    altitudeAccuracy: location.coords.altitudeAccuracy || undefined,
    heading: location.coords.heading || undefined,
    speed: location.coords.speed || undefined,
    timestamp: new Date(location.timestamp),
  };
}

// Validate location data
export function validateLocation(location: LocationData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check latitude bounds
  if (location.latitude < -90 || location.latitude > 90) {
    errors.push('Invalid latitude. Must be between -90 and 90.');
  }

  // Check longitude bounds
  if (location.longitude < -180 || location.longitude > 180) {
    errors.push('Invalid longitude. Must be between -180 and 180.');
  }

  // Check accuracy
  if (location.accuracy < 0) {
    errors.push('Invalid accuracy. Must be a positive number.');
  } else if (location.accuracy > 100) {
    warnings.push('Poor GPS accuracy. Location may be inaccurate.');
  }

  // Check timestamp freshness
  const now = new Date();
  const timeDiff = Math.abs(now.getTime() - location.timestamp.getTime()) / 1000 / 60; // minutes

  if (timeDiff > 5) {
    warnings.push('Location data is stale. May not reflect current position.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}