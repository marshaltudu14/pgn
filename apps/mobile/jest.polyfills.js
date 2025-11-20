/* global jest */
// Basic polyfills for React Native testing

// Mock async storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo modules
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
}));

jest.mock('expo-asset', () => ({
  loadAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  default: {},
}));


// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: {
      ssid: 'TestNetwork',
      strength: 0.8,
    },
  })),
  addEventListener: jest.fn(() => jest.fn()),
  NetInfoStateType: {
    none: 'none',
    wifi: 'wifi',
    cellular: 'cellular',
    ethernet: 'ethernet',
    bluetooth: 'bluetooth',
    wimax: 'wimax',
    other: 'other',
    unknown: 'unknown',
  },
}));

// Mock Expo location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestBackgroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  })),
}));

// Mock Expo camera
jest.mock('expo-camera', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

// Mock Expo image picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{
      uri: 'mock-image-uri',
      fileName: 'mock-image.jpg',
      mimeType: 'image/jpeg',
    }],
  })),
}));