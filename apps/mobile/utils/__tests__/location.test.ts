import {
  requestLocationPermissions,
  isLocationAvailable,
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
  calculateDistance,
  hasSignificantMovement,
  getAccuracyLevel,
  formatCoordinates,
  promptEnableLocationServices,
  validateLocation,
  LocationData,
  LocationAccuracyLevel,
  LocationTrackingOptions,
} from '../location';
import * as Location from 'expo-location';
import { permissionService } from '@/services/permissions';
import { showToast } from '@/utils/toast';

// Mock the dependencies
jest.mock('expo-location');
jest.mock('@/services/permissions');
jest.mock('@/utils/toast');

const mockLocation = Location as jest.Mocked<typeof Location>;
const mockPermissionService = permissionService as jest.Mocked<typeof permissionService>;
const mockShowToast = showToast as jest.Mocked<typeof showToast>;

// Mock implementations
const createMockLocationData = (overrides: Partial<Location.LocationObject> = {}): Location.LocationObject => {
  const baseLocation: Location.LocationObject = {
    coords: {
      latitude: 14.5995,
      longitude: 120.9842,
      altitude: 10,
      altitudeAccuracy: 5,
      accuracy: 10,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
    ...overrides,
  };
  return baseLocation;
};

const createMockLocationSubscription = (): jest.Mocked<Location.LocationSubscription> => {
  return {
    remove: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<Location.LocationSubscription>;
};

describe('Location Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default mock implementations
    mockPermissionService.requestLocationPermission.mockResolvedValue('granted');
    mockPermissionService.checkLocationPermission.mockResolvedValue('granted');
    mockLocation.hasServicesEnabledAsync.mockResolvedValue(true);
    mockLocation.getCurrentPositionAsync.mockResolvedValue(createMockLocationData());
    mockLocation.watchPositionAsync.mockResolvedValue(createMockLocationSubscription());
    mockShowToast.error = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('requestLocationPermissions', () => {
    it('should return true when permission is granted', async () => {
      mockPermissionService.requestLocationPermission.mockResolvedValue('granted');

      const result = await requestLocationPermissions();

      expect(result).toBe(true);
      expect(mockPermissionService.requestLocationPermission).toHaveBeenCalled();
    });

    it('should return false when permission is denied', async () => {
      mockPermissionService.requestLocationPermission.mockResolvedValue('denied');

      const result = await requestLocationPermissions();

      expect(result).toBe(false);
      expect(mockPermissionService.requestLocationPermission).toHaveBeenCalled();
    });

    it('should return false when permission service throws error', async () => {
      mockPermissionService.requestLocationPermission.mockRejectedValue(new Error('Permission error'));

      const result = await requestLocationPermissions();

      expect(result).toBe(false);
    });
  });

  describe('isLocationAvailable', () => {
    it('should return true when permission is granted and services are enabled', async () => {
      mockPermissionService.checkLocationPermission.mockResolvedValue('granted');
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(true);

      const result = await isLocationAvailable();

      expect(result).toBe(true);
      expect(mockPermissionService.checkLocationPermission).toHaveBeenCalled();
      expect(mockLocation.hasServicesEnabledAsync).toHaveBeenCalled();
    });

    it('should return false when permission is denied', async () => {
      mockPermissionService.checkLocationPermission.mockResolvedValue('denied');

      const result = await isLocationAvailable();

      expect(result).toBe(false);
      expect(mockPermissionService.checkLocationPermission).toHaveBeenCalled();
      expect(mockLocation.hasServicesEnabledAsync).not.toHaveBeenCalled();
    });

    it('should return false when services are disabled', async () => {
      mockPermissionService.checkLocationPermission.mockResolvedValue('granted');
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(false);

      const result = await isLocationAvailable();

      expect(result).toBe(false);
      expect(mockPermissionService.checkLocationPermission).toHaveBeenCalled();
      expect(mockLocation.hasServicesEnabledAsync).toHaveBeenCalled();
    });

    it('should return false when permission service throws error', async () => {
      mockPermissionService.checkLocationPermission.mockRejectedValue(new Error('Permission error'));

      const result = await isLocationAvailable();

      expect(result).toBe(false);
    });

    it('should return false when location service throws error', async () => {
      mockPermissionService.checkLocationPermission.mockResolvedValue('granted');
      mockLocation.hasServicesEnabledAsync.mockRejectedValue(new Error('Location service error'));

      const result = await isLocationAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentLocation', () => {
    const mockLocationObject = createMockLocationData({
      coords: {
        latitude: 14.5995,
        longitude: 120.9842,
        altitude: 15,
        altitudeAccuracy: 3,
        accuracy: 5,
        heading: 45,
        speed: 10,
      },
      timestamp: 1640995200000, // 2022-01-01 00:00:00 UTC
    });

    it('should return formatted location data when permission and services are available', async () => {
      mockPermissionService.checkLocationPermission.mockResolvedValue('granted');
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(true);
      mockLocation.getCurrentPositionAsync.mockResolvedValue(mockLocationObject);

      const result = await getCurrentLocation();

      expect(result).toEqual({
        latitude: 14.5995,
        longitude: 120.9842,
        accuracy: 5,
        altitude: 15,
        altitudeAccuracy: 3,
        heading: 45,
        speed: 10,
        timestamp: new Date(1640995200000),
      });
      expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.High,
      });
    });

    it('should throw error when permission is not granted', async () => {
      mockPermissionService.checkLocationPermission.mockResolvedValue('denied');

      await expect(getCurrentLocation()).rejects.toThrow('Location permission is required');
    });

    it('should throw error when location services are disabled', async () => {
      mockPermissionService.checkLocationPermission.mockResolvedValue('granted');
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(false);

      await expect(getCurrentLocation()).rejects.toThrow('Location services are disabled');
    });

    it('should use specified accuracy parameter', async () => {
      mockLocation.getCurrentPositionAsync.mockResolvedValue(mockLocationObject);

      await getCurrentLocation(Location.Accuracy.Balanced);

      expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.Balanced,
      });
    });

    it('should handle location service errors', async () => {
      mockPermissionService.checkLocationPermission.mockResolvedValue('granted');
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(true);
      mockLocation.getCurrentPositionAsync.mockRejectedValue(new Error('GPS error'));

      await expect(getCurrentLocation()).rejects.toThrow('Failed to get current location: GPS error');
    });

    it('should handle unknown errors', async () => {
      mockPermissionService.checkLocationPermission.mockResolvedValue('granted');
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(true);
      mockLocation.getCurrentPositionAsync.mockRejectedValue('Unknown error');

      await expect(getCurrentLocation()).rejects.toThrow('Failed to get current location: Unknown error');
    });

    it('should handle missing accuracy value', async () => {
      const locationWithoutAccuracy = createMockLocationData({
        coords: {
          ...mockLocationObject.coords,
          accuracy: null as any,
        },
      });
      mockLocation.getCurrentPositionAsync.mockResolvedValue(locationWithoutAccuracy);

      const result = await getCurrentLocation();

      expect(result.accuracy).toBe(0);
    });
  });

  describe('startLocationTracking', () => {
    it('should start location tracking with default options', async () => {
      const mockSubscription = createMockLocationSubscription();
      const mockLocationObject = createMockLocationData();
      const mockOnUpdate = jest.fn();

      mockLocation.watchPositionAsync.mockImplementation(
        async (_options, callback) => {
          callback(mockLocationObject);
          return mockSubscription;
        }
      );

      const subscription = await startLocationTracking({}, mockOnUpdate);

      expect(mockLocation.watchPositionAsync).toHaveBeenCalledWith(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5 * 60 * 1000, // 5 minutes
          distanceInterval: 0,
          showsBackgroundLocationIndicator: true,
          foregroundService: undefined,
          pausesUpdatesAutomatically: false,
        },
        expect.any(Function)
      );
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number),
          accuracy: expect.any(Number),
          timestamp: expect.any(Date),
        })
      );
      expect(subscription).toBe(mockSubscription);
    });

    it('should start location tracking with custom options', async () => {
      const mockSubscription = createMockLocationSubscription();
      const customOptions: LocationTrackingOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: 2 * 60 * 1000, // 2 minutes
        distanceInterval: 10,
        showsBackgroundLocationIndicator: false,
        activityType: Location.ActivityType.AutomotiveNavigation,
      };

      mockLocation.watchPositionAsync.mockResolvedValue(mockSubscription);

      await startLocationTracking(customOptions);

      expect(mockLocation.watchPositionAsync).toHaveBeenCalledWith(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2 * 60 * 1000,
          distanceInterval: 10,
          showsBackgroundLocationIndicator: false,
          foregroundService: undefined,
          pausesUpdatesAutomatically: false,
        },
        expect.any(Function)
      );
    });

    it('should throw error when permission is not granted', async () => {
      mockPermissionService.checkLocationPermission.mockResolvedValue('denied');

      await expect(startLocationTracking()).rejects.toThrow('Location permission is required for tracking');
    });

    it('should handle tracking errors', async () => {
      mockLocation.watchPositionAsync.mockRejectedValue(new Error('Tracking error'));

      await expect(startLocationTracking()).rejects.toThrow('Failed to start location tracking: Tracking error');
    });
  });

  describe('stopLocationTracking', () => {
    it('should stop location tracking when subscription exists', async () => {
      const mockSubscription = createMockLocationSubscription();

      await stopLocationTracking(mockSubscription);

      expect(mockSubscription.remove).toHaveBeenCalled();
    });

    it('should handle null subscription gracefully', async () => {
      await expect(stopLocationTracking(null)).resolves.not.toThrow();
    });

    it('should handle subscription removal errors', async () => {
      const mockSubscription = createMockLocationSubscription();
      (mockSubscription.remove as jest.Mock).mockRejectedValue(new Error('Removal error'));

      await expect(stopLocationTracking(mockSubscription)).resolves.not.toThrow();
    });
  });

  describe('calculateDistance', () => {
    // Test with known coordinates and expected distances
    const testCases = [
      {
        name: 'Same coordinates',
        lat1: 14.5995,
        lon1: 120.9842,
        lat2: 14.5995,
        lon2: 120.9842,
        expectedDistance: 0,
      },
      {
        name: 'Short distance (Manila coordinates)',
        lat1: 14.5995,
        lon1: 120.9842, // Manila
        lat2: 14.6091,
        lon2: 120.9951, // Slightly north-east
        expectedDistance: 1600, // ~1.6km
      },
      {
        name: 'Medium distance',
        lat1: 14.5995,
        lon1: 120.9842, // Manila
        lat2: 14.6760,
        lon2: 121.0437, // Quezon City
        expectedDistance: 10600, // ~10.6km
      },
    ];

    testCases.forEach(({ name, lat1, lon1, lat2, lon2, expectedDistance }) => {
      it(`should calculate ${name} correctly`, () => {
        const distance = calculateDistance(lat1, lon1, lat2, lon2);
        expect(distance).toBeCloseTo(expectedDistance, -2); // Allow 2-digit precision error
      });
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-33.8688, 151.2093, -33.8568, 151.2153); // Sydney
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(1440, -2); // ~1.44km
    });

    it('should handle coordinates across the equator', () => {
      const distance = calculateDistance(-1.0, 103.5, 1.0, 103.5); // Singapore area
      expect(distance).toBeCloseTo(222000, -3); // ~222km
    });

    it('should handle coordinates across the antimeridian', () => {
      const distance = calculateDistance(21.3069, -157.8583, 21.3069, 157.9583); // Hawaii area
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('hasSignificantMovement', () => {
    const previousLocation: LocationData = {
      latitude: 14.5995,
      longitude: 120.9842,
      accuracy: 10,
      timestamp: new Date(),
    };

    it('should return true for movement exceeding default threshold (50m)', () => {
      const currentLocation: LocationData = {
        latitude: 14.6000, // ~55m north
        longitude: 120.9842,
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = hasSignificantMovement(previousLocation, currentLocation);

      expect(result).toBe(true);
    });

    it('should return false for movement below threshold', () => {
      const currentLocation: LocationData = {
        latitude: 14.5998, // ~33m north
        longitude: 120.9842,
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = hasSignificantMovement(previousLocation, currentLocation);

      expect(result).toBe(false);
    });

    it('should use custom threshold', () => {
      const currentLocation: LocationData = {
        latitude: 14.5998, // ~33m north
        longitude: 120.9842,
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = hasSignificantMovement(previousLocation, currentLocation, 30);

      expect(result).toBe(true);
    });

    it('should return false for same location', () => {
      const currentLocation: LocationData = { ...previousLocation };

      const result = hasSignificantMovement(previousLocation, currentLocation);

      expect(result).toBe(false);
    });

    it('should return true for movement exactly at threshold', () => {
      const currentLocation: LocationData = {
        latitude: 14.599950, // ~50m north
        longitude: 120.9842,
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = hasSignificantMovement(previousLocation, currentLocation);

      expect(result).toBe(true);
    });
  });

  describe('getAccuracyLevel', () => {
    const testCases: Array<{
      accuracy: number;
      expected: LocationAccuracyLevel;
    }> = [
      {
        accuracy: 3,
        expected: {
          level: 'EXCELLENT',
          color: '#10B981',
          description: 'Very accurate location (±5m)',
        },
      },
      {
        accuracy: 8,
        expected: {
          level: 'GOOD',
          color: '#3B82F6',
          description: 'Good location accuracy (±10m)',
        },
      },
      {
        accuracy: 15,
        expected: {
          level: 'FAIR',
          color: '#F59E0B',
          description: 'Fair location accuracy (±20m)',
        },
      },
      {
        accuracy: 35,
        expected: {
          level: 'POOR',
          color: '#EF4444',
          description: 'Poor location accuracy (±50m)',
        },
      },
      {
        accuracy: 75,
        expected: {
          level: 'VERY POOR',
          color: '#7C3AED',
          description: 'Very poor location accuracy (>±50m)',
        },
      },
    ];

    testCases.forEach(({ accuracy, expected }) => {
      it(`should return ${expected.level} for accuracy ${accuracy}m`, () => {
        const result = getAccuracyLevel(accuracy);

        expect(result).toEqual(expected);
      });
    });

    it('should handle boundary values correctly', () => {
      expect(getAccuracyLevel(5).level).toBe('EXCELLENT');
      expect(getAccuracyLevel(10).level).toBe('GOOD');
      expect(getAccuracyLevel(20).level).toBe('FAIR');
      expect(getAccuracyLevel(50).level).toBe('POOR');
      expect(getAccuracyLevel(51).level).toBe('VERY POOR');
    });

    it('should handle zero accuracy', () => {
      const result = getAccuracyLevel(0);

      expect(result.level).toBe('EXCELLENT');
      expect(result.color).toBe('#10B981');
    });
  });

  describe('formatCoordinates', () => {
    it('should format coordinates with 6 decimal places', () => {
      const result = formatCoordinates(14.599512345, 120.984212345);

      expect(result).toBe('14.599512, 120.984212');
    });

    it('should handle negative coordinates', () => {
      const result = formatCoordinates(-33.868800, -157.858300);

      expect(result).toBe('-33.868800, -157.858300');
    });

    it('should handle coordinates with fewer decimal places', () => {
      const result = formatCoordinates(14.5, 120.9);

      expect(result).toBe('14.500000, 120.900000');
    });

    it('should handle zero coordinates', () => {
      const result = formatCoordinates(0, 0);

      expect(result).toBe('0.000000, 0.000000');
    });
  });

  describe('promptEnableLocationServices', () => {
    it('should show error toast when location services are disabled', async () => {
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(false);

      await promptEnableLocationServices();

      expect(mockShowToast.error).toHaveBeenCalledWith(
        'Location services are disabled. Please enable location services in your device settings to use this feature.'
      );
    });

    it('should not show toast when location services are enabled', async () => {
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(true);

      await promptEnableLocationServices();

      expect(mockShowToast.error).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockLocation.hasServicesEnabledAsync.mockRejectedValue(new Error('Service error'));

      await expect(promptEnableLocationServices()).resolves.not.toThrow();
      expect(mockShowToast.error).not.toHaveBeenCalled();
    });
  });

  describe('validateLocation', () => {
    it('should validate correct location data', () => {
      const validLocation: LocationData = {
        latitude: 14.5995,
        longitude: 120.9842,
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = validateLocation(validLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect invalid latitude', () => {
      const invalidLocation: LocationData = {
        latitude: 91, // Invalid latitude
        longitude: 120.9842,
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid latitude. Must be between -90 and 90.');
    });

    it('should detect invalid negative latitude', () => {
      const invalidLocation: LocationData = {
        latitude: -91, // Invalid latitude
        longitude: 120.9842,
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid latitude. Must be between -90 and 90.');
    });

    it('should detect invalid longitude', () => {
      const invalidLocation: LocationData = {
        latitude: 14.5995,
        longitude: 181, // Invalid longitude
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid longitude. Must be between -180 and 180.');
    });

    it('should detect invalid negative longitude', () => {
      const invalidLocation: LocationData = {
        latitude: 14.5995,
        longitude: -181, // Invalid longitude
        accuracy: 10,
        timestamp: new Date(),
      };

      const result = validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid longitude. Must be between -180 and 180.');
    });

    it('should detect negative accuracy', () => {
      const invalidLocation: LocationData = {
        latitude: 14.5995,
        longitude: 120.9842,
        accuracy: -5, // Invalid accuracy
        timestamp: new Date(),
      };

      const result = validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid accuracy. Must be a positive number.');
    });

    it('should warn about poor accuracy', () => {
      const poorLocation: LocationData = {
        latitude: 14.5995,
        longitude: 120.9842,
        accuracy: 150, // Poor accuracy
        timestamp: new Date(),
      };

      const result = validateLocation(poorLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain('Poor GPS accuracy. Location may be inaccurate.');
    });

    it('should warn about stale location data', () => {
      const staleDate = new Date();
      staleDate.setMinutes(staleDate.getMinutes() - 10); // 10 minutes ago

      const staleLocation: LocationData = {
        latitude: 14.5995,
        longitude: 120.9842,
        accuracy: 10,
        timestamp: staleDate,
      };

      const result = validateLocation(staleLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain('Location data is stale. May not reflect current position.');
    });

    it('should accumulate multiple errors and warnings', () => {
      const invalidLocation: LocationData = {
        latitude: 91, // Invalid latitude
        longitude: 181, // Invalid longitude
        accuracy: -5, // Invalid accuracy
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      };

      const result = validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle boundary coordinate values', () => {
      const boundaryLocation: LocationData = {
        latitude: 90, // Maximum valid latitude
        longitude: 180, // Maximum valid longitude
        accuracy: 0,
        timestamp: new Date(),
      };

      const result = validateLocation(boundaryLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle minimum boundary coordinate values', () => {
      const boundaryLocation: LocationData = {
        latitude: -90, // Minimum valid latitude
        longitude: -180, // Minimum valid longitude
        accuracy: 0,
        timestamp: new Date(),
      };

      const result = validateLocation(boundaryLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});