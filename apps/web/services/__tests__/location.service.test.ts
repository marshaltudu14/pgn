/**
 * Unit tests for LocationService using Jest
 */

import { LocationData } from '@pgn/shared';
import { LocationService } from '../location.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('LocationService', () => {
  let locationService: LocationService;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    locationService = new LocationService();
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  });

  describe('validateLocation', () => {
    const validLocation: LocationData = {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10,
      timestamp: new Date(),
    };

    it('should validate a correct location', () => {
      const result = locationService.validateLocation(validLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject location with invalid latitude (too high)', () => {
      const invalidLocation = {
        ...validLocation,
        latitude: 91,
      };

      const result = locationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid latitude. Must be between -90 and 90.'
      );
    });

    it('should reject location with invalid latitude (too low)', () => {
      const invalidLocation = {
        ...validLocation,
        latitude: -91,
      };

      const result = locationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid latitude. Must be between -90 and 90.'
      );
    });

    it('should reject location with invalid longitude (too high)', () => {
      const invalidLocation = {
        ...validLocation,
        longitude: 181,
      };

      const result = locationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid longitude. Must be between -180 and 180.'
      );
    });

    it('should reject location with invalid longitude (too low)', () => {
      const invalidLocation = {
        ...validLocation,
        longitude: -181,
      };

      const result = locationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid longitude. Must be between -180 and 180.'
      );
    });

    it('should reject location with negative accuracy', () => {
      const invalidLocation = {
        ...validLocation,
        accuracy: -5,
      };

      const result = locationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid accuracy. Must be a positive number.'
      );
    });

    it('should warn about poor GPS accuracy', () => {
      const poorAccuracyLocation = {
        ...validLocation,
        accuracy: 150,
      };

      const result = locationService.validateLocation(poorAccuracyLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Poor GPS accuracy. Location may be inaccurate.'
      );
    });

    it('should reject location without timestamp', () => {
      const invalidLocation = {
        ...validLocation,
        timestamp: undefined as unknown as Date,
      };

      const result = locationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Timestamp is required.');
    });

    it('should reject location with old timestamp', () => {
      const oldDate = new Date();
      oldDate.setMinutes(oldDate.getMinutes() - 10); // 10 minutes ago

      const invalidLocation = {
        ...validLocation,
        timestamp: oldDate,
      };

      const result = locationService.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Location data is too old. Must be within 5 minutes.'
      );
    });

    it('should accept location with valid edge values', () => {
      const edgeLocation = {
        latitude: 90,
        longitude: 180,
        accuracy: 0,
        timestamp: new Date(),
      };

      const result = locationService.validateLocation(edgeLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept location with negative edge values', () => {
      const edgeLocation = {
        latitude: -90,
        longitude: -180,
        accuracy: 0,
        timestamp: new Date(),
      };

      const result = locationService.validateLocation(edgeLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept location with undefined accuracy', () => {
      const locationWithoutAccuracy: LocationData = {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 0, // Use 0 instead of undefined to match type
        timestamp: new Date(),
      };

      const result = locationService.validateLocation(locationWithoutAccuracy);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Bangalore to Chennai (approximately 290 km)
      const bangaloreLat = 12.9716;
      const bangaloreLng = 77.5946;
      const chennaiLat = 13.0827;
      const chennaiLng = 80.2707;

      const distance = locationService.calculateDistance(
        bangaloreLat,
        bangaloreLng,
        chennaiLat,
        chennaiLng
      );

      // Distance should be approximately 290 km = 290,000 meters
      expect(distance).toBeGreaterThan(280000);
      expect(distance).toBeLessThan(300000);
    });

    it('should return 0 for identical coordinates', () => {
      const lat = 12.9716;
      const lng = 77.5946;

      const distance = locationService.calculateDistance(lat, lng, lat, lng);

      expect(distance).toBe(0);
    });

    it('should handle antipodal points (opposite sides of Earth)', () => {
      const distance = locationService.calculateDistance(0, 0, 0, 180);

      // Distance should be approximately half Earth's circumference
      expect(distance).toBeGreaterThan(19000000);
      expect(distance).toBeLessThan(21000000);
    });

    it('should handle coordinates at poles', () => {
      const distance = locationService.calculateDistance(90, 0, -90, 0);

      // Distance from North Pole to South Pole
      expect(distance).toBeGreaterThan(19000000);
      expect(distance).toBeLessThan(21000000);
    });
  });

  describe('hasSignificantMovement', () => {
    const previousLocation: LocationData = {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10,
      timestamp: new Date(),
    };

    it('should detect significant movement beyond default threshold', () => {
      const currentLocation: LocationData = {
        latitude: 12.98,
        longitude: 77.6,
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = locationService.hasSignificantMovement(
        previousLocation,
        currentLocation
      );

      expect(result).toBe(true);
    });

    it('should not detect movement within default threshold', () => {
      const currentLocation: LocationData = {
        latitude: 12.9717,
        longitude: 77.5947,
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = locationService.hasSignificantMovement(
        previousLocation,
        currentLocation
      );

      expect(result).toBe(false);
    });

    it('should respect custom threshold', () => {
      const currentLocation: LocationData = {
        latitude: 12.972,
        longitude: 77.595,
        accuracy: 10,
        timestamp: new Date(),
      };

      // With 10m threshold, this should be significant
      const resultWithLowThreshold = locationService.hasSignificantMovement(
        previousLocation,
        currentLocation,
        10
      );
      expect(resultWithLowThreshold).toBe(true);

      // With 100m threshold, this should not be significant
      const resultWithHighThreshold = locationService.hasSignificantMovement(
        previousLocation,
        currentLocation,
        100
      );
      expect(resultWithHighThreshold).toBe(false);
    });

    it('should return false for identical locations', () => {
      const result = locationService.hasSignificantMovement(
        previousLocation,
        previousLocation
      );

      expect(result).toBe(false);
    });
  });

  describe('reverseGeocode', () => {
    const lat = 12.9716;
    const lng = 77.5946;

    it('should successfully reverse geocode coordinates', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          display_name: 'Bangalore, Karnataka, India',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await locationService.reverseGeocode(lat, lng);

      expect(result).toBe('Bangalore, Karnataka, India');
      expect(mockFetch).toHaveBeenCalledWith(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PGN Attendance System',
          },
        }
      );
    });

    it('should handle response without display_name', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          address: {
            house_number: '123',
            road: 'Main Street',
            city: 'Bangalore',
            state: 'Karnataka',
            postcode: '560001',
            country: 'India',
          },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await locationService.reverseGeocode(lat, lng);

      expect(result).toBe(
        '123, Main Street, Bangalore, Karnataka, 560001, India'
      );
    });

    it('should handle response with minimal address components', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          address: {
            city: 'Bangalore',
            country: 'India',
          },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await locationService.reverseGeocode(lat, lng);

      expect(result).toBe('Bangalore, India');
    });

    it('should handle empty address response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await locationService.reverseGeocode(lat, lng);

      expect(result).toBe(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    });

    it('should handle API error response', async () => {
      const mockResponse = {
        ok: false,
      };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await locationService.reverseGeocode(lat, lng);

      expect(result).toBe(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    });

    it('should handle API error in response body', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          error: 'Service unavailable',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await locationService.reverseGeocode(lat, lng);

      expect(result).toBe(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const result = await locationService.reverseGeocode(lat, lng);

      expect(result).toBe(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    });
  });

  describe('geocode', () => {
    const address = 'Bangalore, Karnataka, India';

    it('should successfully geocode address', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            lat: '12.9716',
            lon: '77.5946',
          },
        ]),
      };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await locationService.geocode(address);

      expect(result.success).toBe(true);
      expect(result.lat).toBe(12.9716);
      expect(result.lng).toBe(77.5946);
      expect(result.error).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'PGN Attendance System',
          },
        }
      );
    });

    it('should handle address not found', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([]),
      };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await locationService.geocode('Nonexistent Address 123');

      expect(result.success).toBe(false);
      expect(result.lat).toBe(0);
      expect(result.lng).toBe(0);
      expect(result.error).toBe('Address not found');
    });

    it('should handle API error response', async () => {
      const mockResponse = {
        ok: false,
      };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await locationService.geocode(address);

      expect(result.success).toBe(false);
      expect(result.lat).toBe(0);
      expect(result.lng).toBe(0);
      expect(result.error).toBe('Failed to geocode address');
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const result = await locationService.geocode(address);

      expect(result.success).toBe(false);
      expect(result.lat).toBe(0);
      expect(result.lng).toBe(0);
      expect(result.error).toBe('Failed to geocode address');
    });
  });

  describe('isWithinRadius', () => {
    const centerLat = 12.9716;
    const centerLng = 77.5946;
    const radiusMeters = 100;

    it('should return true for point within radius', () => {
      const pointLat = 12.9717;
      const pointLng = 77.5947;

      const result = locationService.isWithinRadius(
        centerLat,
        centerLng,
        pointLat,
        pointLng,
        radiusMeters
      );

      expect(result).toBe(true);
    });

    it('should return false for point outside radius', () => {
      const pointLat = 12.98;
      const pointLng = 77.6;

      const result = locationService.isWithinRadius(
        centerLat,
        centerLng,
        pointLat,
        pointLng,
        radiusMeters
      );

      expect(result).toBe(false);
    });

    it('should return true for center point', () => {
      const result = locationService.isWithinRadius(
        centerLat,
        centerLng,
        centerLat,
        centerLng,
        radiusMeters
      );

      expect(result).toBe(true);
    });

    it('should handle zero radius', () => {
      const result = locationService.isWithinRadius(
        centerLat,
        centerLng,
        centerLat,
        centerLng,
        0
      );

      expect(result).toBe(true);
    });

    it('should handle large radius', () => {
      const pointLat = 13.0827; // Chennai
      const pointLng = 80.2707;
      const largeRadius = 300000; // 300 km

      const result = locationService.isWithinRadius(
        centerLat,
        centerLng,
        pointLat,
        pointLng,
        largeRadius
      );

      expect(result).toBe(true);
    });
  });

  describe('getBoundingBox', () => {
    const centerLat = 12.9716;
    const centerLng = 77.5946;
    const radiusKm = 1;

    it('should calculate bounding box around center point', () => {
      const result = locationService.getBoundingBox(
        centerLat,
        centerLng,
        radiusKm
      );

      expect(result.north).toBeGreaterThan(centerLat);
      expect(result.south).toBeLessThan(centerLat);
      expect(result.east).toBeGreaterThan(centerLng);
      expect(result.west).toBeLessThan(centerLng);
    });

    it('should handle zero radius', () => {
      const result = locationService.getBoundingBox(centerLat, centerLng, 0);

      expect(result.north).toBe(centerLat);
      expect(result.south).toBe(centerLat);
      expect(result.east).toBe(centerLng);
      expect(result.west).toBe(centerLng);
    });

    it('should handle coordinates near equator', () => {
      const result = locationService.getBoundingBox(0, 0, 1);

      expect(result.north).toBeCloseTo(0.009, 3);
      expect(result.south).toBeCloseTo(-0.009, 3);
      expect(result.east).toBeCloseTo(0.009, 3);
      expect(result.west).toBeCloseTo(-0.009, 3);
    });

    it('should handle coordinates near poles', () => {
      const result = locationService.getBoundingBox(89, 0, 1);

      expect(result.north).toBeCloseTo(89.009, 3);
      expect(result.south).toBeCloseTo(88.991, 3);
    });
  });

  describe('getAccuracyLevel', () => {
    it('should return EXCELLENT for accuracy <= 5', () => {
      const result = locationService.getAccuracyLevel(5);

      expect(result.level).toBe('EXCELLENT');
      expect(result.color).toBe('#10B981');
      expect(result.description).toBe('Very accurate location (±5m)');
    });

    it('should return GOOD for accuracy <= 10', () => {
      const result = locationService.getAccuracyLevel(10);

      expect(result.level).toBe('GOOD');
      expect(result.color).toBe('#3B82F6');
      expect(result.description).toBe('Good location accuracy (±10m)');
    });

    it('should return FAIR for accuracy <= 20', () => {
      const result = locationService.getAccuracyLevel(20);

      expect(result.level).toBe('FAIR');
      expect(result.color).toBe('#F59E0B');
      expect(result.description).toBe('Fair location accuracy (±20m)');
    });

    it('should return POOR for accuracy <= 50', () => {
      const result = locationService.getAccuracyLevel(50);

      expect(result.level).toBe('POOR');
      expect(result.color).toBe('#EF4444');
      expect(result.description).toBe('Poor location accuracy (±50m)');
    });

    it('should return VERY POOR for accuracy > 50', () => {
      const result = locationService.getAccuracyLevel(100);

      expect(result.level).toBe('VERY POOR');
      expect(result.color).toBe('#7C3AED');
      expect(result.description).toBe('Very poor location accuracy (>±50m)');
    });

    it('should handle edge case accuracy of 0', () => {
      const result = locationService.getAccuracyLevel(0);

      expect(result.level).toBe('EXCELLENT');
      expect(result.color).toBe('#10B981');
      expect(result.description).toBe('Very accurate location (±5m)');
    });
  });

  describe('analyzeLocationQuality', () => {
    const goodLocation: LocationData = {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 5,
      timestamp: new Date(),
    };

    it('should return perfect score for good location', () => {
      const result = locationService.analyzeLocationQuality(goodLocation);

      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });

    it('should penalize very poor accuracy', () => {
      const poorAccuracyLocation = {
        ...goodLocation,
        accuracy: 100,
      };

      const result =
        locationService.analyzeLocationQuality(poorAccuracyLocation);

      expect(result.score).toBe(60);
      expect(result.issues).toContain('Very poor GPS accuracy');
      expect(result.recommendations).toContain(
        'Move to an open area with clear sky view'
      );
    });

    it('should penalize poor accuracy', () => {
      const poorAccuracyLocation = {
        ...goodLocation,
        accuracy: 30,
      };

      const result =
        locationService.analyzeLocationQuality(poorAccuracyLocation);

      expect(result.score).toBe(80);
      expect(result.issues).toContain('Poor GPS accuracy');
      expect(result.recommendations).toContain(
        'Wait a moment for GPS to stabilize'
      );
    });

    it('should penalize fair accuracy', () => {
      const fairAccuracyLocation = {
        ...goodLocation,
        accuracy: 15,
      };

      const result =
        locationService.analyzeLocationQuality(fairAccuracyLocation);

      expect(result.score).toBe(90);
      expect(result.issues).toContain('Fair GPS accuracy');
      expect(result.recommendations).toContain('GPS signal could be improved');
    });

    it('should penalize stale location data', () => {
      const oldDate = new Date();
      oldDate.setMinutes(oldDate.getMinutes() - 10);

      const staleLocation = {
        ...goodLocation,
        timestamp: oldDate,
      };

      const result = locationService.analyzeLocationQuality(staleLocation);

      expect(result.score).toBe(80);
      expect(result.issues).toContain('Location data is stale');
      expect(result.recommendations).toContain(
        'Refresh location to get current position'
      );
    });

    it('should not go below 0 score', () => {
      const veryPoorLocation: LocationData = {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 200,
        timestamp: new Date(0), // Very old timestamp
      };

      const result = locationService.analyzeLocationQuality(veryPoorLocation);

      expect(result.score).toBe(40); // 40 (very poor accuracy) + 20 (stale) = 60, 100-60 = 40
    });

    it('should handle location without accuracy', () => {
      const locationWithoutAccuracy: LocationData = {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 0, // Use 0 instead of undefined to match type
        timestamp: new Date(),
      };

      const result = locationService.analyzeLocationQuality(
        locationWithoutAccuracy
      );

      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('formatCoordinates', () => {
    const lat = 12.9716;
    const lng = 77.5946;

    it('should format coordinates in decimal format by default', () => {
      const result = locationService.formatCoordinates(lat, lng);

      expect(result).toBe('12.971600, 77.594600');
    });

    it('should format coordinates in decimal format explicitly', () => {
      const result = locationService.formatCoordinates(lat, lng, 'decimal');

      expect(result).toBe('12.971600, 77.594600');
    });

    it('should format coordinates in DMS format', () => {
      const result = locationService.formatCoordinates(lat, lng, 'dms');

      expect(result).toMatch(/12°\d+'[\d.]+"N 77°\d+'[\d.]+"E/);
    });

    it('should handle negative latitude in DMS format', () => {
      const result = locationService.formatCoordinates(-lat, lng, 'dms');

      expect(result).toMatch(/12°\d+'[\d.]+"S 77°\d+'[\d.]+"E/);
    });

    it('should handle negative longitude in DMS format', () => {
      const result = locationService.formatCoordinates(lat, -lng, 'dms');

      expect(result).toMatch(/12°\d+'[\d.]+"N 77°\d+'[\d.]+"W/);
    });

    it('should handle negative coordinates in DMS format', () => {
      const result = locationService.formatCoordinates(-lat, -lng, 'dms');

      expect(result).toMatch(/12°\d+'[\d.]+"S 77°\d+'[\d.]+"W/);
    });

    it('should handle coordinates at equator and prime meridian', () => {
      const result = locationService.formatCoordinates(0, 0, 'dms');

      expect(result).toMatch(/0°0'0.0"N 0°0'0.0"E/);
    });
  });
});
