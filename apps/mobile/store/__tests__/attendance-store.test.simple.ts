// Simplified test to identify issues
import { renderHook, act } from '@testing-library/react';

// Set up fake timers
jest.useFakeTimers();

// Mock crypto
if (!global.crypto) {
  global.crypto = {
    getRandomValues: jest.fn(() => new Uint32Array(1)),
    subtle: {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
      digest: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    },
  } as any;
}

// Mock all dependencies upfront
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/services/api-client', () => ({
  api: {
    get: jest.fn(() => Promise.resolve({
      success: true,
      data: { status: 'CHECKED_OUT' }
    })),
    post: jest.fn(() => Promise.resolve({
      success: true,
      data: { attendanceId: 'test-id' }
    })),
  },
}));

jest.mock('@/services/location-foreground-service-notifee', () => ({
  locationTrackingServiceNotifee: {
    initialize: jest.fn(() => Promise.resolve(true)),
    isTrackingActive: jest.fn(() => false),
    startTracking: jest.fn(() => Promise.resolve(true)),
    stopTracking: jest.fn(() => Promise.resolve(true)),
    setLocationUpdateCallback: jest.fn(),
    getState: jest.fn(() => ({ isTracking: false, consecutiveFailures: 0 })),
    getEmergencyData: jest.fn(() => Promise.resolve(null)),
    clearEmergencyData: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../auth-store', () => ({
  useAuth: {
    getState: jest.fn(() => ({
      user: {
        id: 'employee-123',
        firstName: 'Test',
        lastName: 'Employee',
      },
    })),
  },
}));

jest.mock('expo-battery', () => ({
  getBatteryLevelAsync: jest.fn(() => Promise.resolve(0.85)),
}));

jest.mock('react-native-device-info', () => ({
  getModel: jest.fn(() => 'Test Phone'),
  getBrand: jest.fn(() => 'Test Brand'),
  getVersion: jest.fn(() => '1.0.0'),
}));

jest.mock('@/utils/camera', () => ({
  isCameraAvailable: jest.fn(() => Promise.resolve(true)),
  takePhoto: jest.fn(() => Promise.resolve({
    uri: 'file://mock-photo.jpg',
    width: 1920,
    height: 1080,
    fileSize: 500000,
    type: 'image/jpeg',
    name: 'mock-photo.jpg',
  })),
  pickPhotoFromLibrary: jest.fn(() => Promise.resolve({
    uri: 'file://mock-photo.jpg',
    width: 1920,
    height: 1080,
    fileSize: 500000,
    type: 'image/jpeg',
    name: 'mock-photo.jpg',
  })),
  validatePhoto: jest.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
  })),
  compressPhoto: jest.fn(() => Promise.resolve({
    uri: 'file://mock-photo.jpg',
    width: 1920,
    height: 1080,
    fileSize: 500000,
    type: 'image/jpeg',
    name: 'mock-photo.jpg',
  })),
  CameraError: class CameraError extends Error {
    constructor(code: string, message: string) {
      super(message);
      this.name = 'CameraError';
    }
  },
}));

jest.mock('@/utils/location', () => ({
  getCurrentLocation: jest.fn(() => Promise.resolve({
    latitude: 14.5995,
    longitude: 120.9842,
    accuracy: 10,
    timestamp: new Date(),
  })),
  isLocationAvailable: jest.fn(() => Promise.resolve(true)),
}));

describe('Attendance Store Simplified Test', () => {
  jest.setTimeout(10000);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should import useAttendance hook', async () => {
    const { useAttendance } = await import('../attendance-store');
    expect(typeof useAttendance).toBe('function');
  });

  it('should have correct initial state', async () => {
    const { useAttendance } = await import('../attendance-store');
    const { result } = renderHook(() => useAttendance());

    expect(result.current.currentStatus).toBe('CHECKED_OUT');
    expect(result.current.currentAttendanceId).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  afterAll(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });
});