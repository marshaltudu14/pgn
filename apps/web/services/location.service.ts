import { LocationData } from '@pgn/shared';

export class LocationService {
  /**
   * Validate GPS location accuracy and coordinates
   */
  validateLocation(location: LocationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check latitude bounds
    if (location.latitude < -90 || location.latitude > 90) {
      errors.push('Invalid latitude. Must be between -90 and 90.');
    }

    // Check longitude bounds
    if (location.longitude < -180 || location.longitude > 180) {
      errors.push('Invalid longitude. Must be between -180 and 180.');
    }

    // Check accuracy (if provided)
    if (location.accuracy !== undefined) {
      if (location.accuracy < 0) {
        errors.push('Invalid accuracy. Must be a positive number.');
      } else if (location.accuracy > 100) {
        errors.push('Poor GPS accuracy. Location may be inaccurate.');
      }
    }

    // Check timestamp
    if (!location.timestamp) {
      errors.push('Timestamp is required.');
    } else {
      const now = new Date();
      const locationTime = new Date(location.timestamp);
      const timeDiff = Math.abs(now.getTime() - locationTime.getTime()) / 1000 / 60; // minutes

      if (timeDiff > 5) {
        errors.push('Location data is too old. Must be within 5 minutes.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate distance between two GPS coordinates in meters
   */
  calculateDistance(
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

  /**
   * Check if location movement exceeds threshold (50 meters)
   */
  hasSignificantMovement(
    previousLocation: LocationData,
    currentLocation: LocationData,
    threshold: number = 50
  ): boolean {
    const distance = this.calculateDistance(
      previousLocation.latitude,
      previousLocation.longitude,
      currentLocation.latitude,
      currentLocation.longitude
    );

    return distance >= threshold;
  }

  /**
   * Get formatted address from coordinates (reverse geocoding)
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // This is a placeholder implementation
      // In production, you would use a geocoding service like:
      // - OpenStreetMap Nominatim (free)
      // - Google Maps Geocoding API
      // - Mapbox Geocoding API

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PGN Attendance System' // Be a good citizen
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Extract formatted address or create one from components
      if (data.display_name) {
        return data.display_name;
      }

      // Fallback: create address from components
      const address = data.address || {};
      const parts = [
        address.house_number,
        address.road,
        address.suburb,
        address.city || address.town || address.village,
        address.state,
        address.postcode,
        address.country
      ].filter(Boolean);

      return parts.join(', ') || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Error reverse geocoding location:', error);
      // Return coordinates as fallback
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  /**
   * Geocode address to coordinates (forward geocoding)
   */
  async geocode(address: string): Promise<{ lat: number; lng: number; success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'PGN Attendance System'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      if (data.length === 0) {
        return {
          lat: 0,
          lng: 0,
          success: false,
          error: 'Address not found'
        };
      }

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        success: true
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return {
        lat: 0,
        lng: 0,
        success: false,
        error: 'Failed to geocode address'
      };
    }
  }

  /**
   * Check if location is within a specified radius of a center point
   */
  isWithinRadius(
    centerLat: number,
    centerLng: number,
    pointLat: number,
    pointLng: number,
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(centerLat, centerLng, pointLat, pointLng);
    return distance <= radiusMeters;
  }

  /**
   * Calculate bounding box around a center point
   */
  getBoundingBox(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): { north: number; south: number; east: number; west: number } {
    const latDelta = radiusKm / 111.32; // Approximate km per degree latitude
    const lngDelta = radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));

    return {
      north: centerLat + latDelta,
      south: centerLat - latDelta,
      east: centerLng + lngDelta,
      west: centerLng - lngDelta
    };
  }

  /**
   * Get GPS accuracy level description
   */
  getAccuracyLevel(accuracy: number): { level: string; color: string; description: string } {
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
        color: '#F59E0B', // amber
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

  /**
   * Analyze location data quality
   */
  analyzeLocationQuality(location: LocationData): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check accuracy
    if (location.accuracy) {
      if (location.accuracy > 50) {
        issues.push('Very poor GPS accuracy');
        recommendations.push('Move to an open area with clear sky view');
        score -= 40;
      } else if (location.accuracy > 20) {
        issues.push('Poor GPS accuracy');
        recommendations.push('Wait a moment for GPS to stabilize');
        score -= 20;
      } else if (location.accuracy > 10) {
        issues.push('Fair GPS accuracy');
        recommendations.push('GPS signal could be improved');
        score -= 10;
      }
    }

    // Check timestamp freshness
    const now = new Date();
    const locationTime = new Date(location.timestamp);
    const timeDiff = Math.abs(now.getTime() - locationTime.getTime()) / 1000 / 60; // minutes

    if (timeDiff > 5) {
      issues.push('Location data is stale');
      recommendations.push('Refresh location to get current position');
      score -= 20;
    }

    // Check for impossible movement (if we had previous location)
    // This would need to be implemented with previous location comparison

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(lat: number, lng: number, format: 'decimal' | 'dms' = 'decimal'): string {
    if (format === 'dms') {
      // Convert to degrees, minutes, seconds
      const latDir = lat >= 0 ? 'N' : 'S';
      const lngDir = lng >= 0 ? 'E' : 'W';

      const latDeg = Math.floor(Math.abs(lat));
      const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);
      const latSec = ((Math.abs(lat) - latDeg) * 60 - latMin) * 60;

      const lngDeg = Math.floor(Math.abs(lng));
      const lngMin = Math.floor((Math.abs(lng) - lngDeg) * 60);
      const lngSec = ((Math.abs(lng) - lngDeg) * 60 - lngMin) * 60;

      return `${latDeg}°${latMin}'${latSec.toFixed(1)}"${latDir} ${lngDeg}°${lngMin}'${lngSec.toFixed(1)}"${lngDir}`;
    } else {
      // Decimal degrees format
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();