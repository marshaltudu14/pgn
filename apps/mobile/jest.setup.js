/* eslint-env jest */

// Add React Native development globals that are preset expects
global.__DEV__ = true;

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock react-native-reanimated to prevent native driver issues
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  screensEnabled: jest.fn(),
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    dispatch: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
    name: 'mock-route',
    key: 'mock-key',
  }),
  useFocusEffect: jest.fn(),
  useIsFocused: jest.fn(() => true),
  createNavigationContainerRef: jest.fn(),
  NavigationContainer: ({ children }) => children,
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  useFocusEffect: jest.fn(),
  usePathname: jest.fn(() => '/test'),
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '14.0',
    select: jest.fn((obj) => obj.ios),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667, scale: 2, fontScale: 1 })),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn((layoutSize) => layoutSize * 2),
    roundToNearestPixel: jest.fn((layoutSize) => layoutSize),
  },
  Alert: {
    alert: jest.fn(),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((style) => style),
    compose: jest.fn((style1, style2) => ({ ...style1, ...style2 })),
  },
  Animated: {
    Value: jest.fn(),
    event: jest.fn(),
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
    decay: jest.fn(() => ({ start: jest.fn() })),
    seq: jest.fn(),
    parallel: jest.fn(),
    stagger: jest.fn(),
    delay: jest.fn(),
  },
}));

// Mock react-native/Libraries/TurboModule/TurboModuleRegistry
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: jest.fn(() => ({})),
  getEnforcing: jest.fn(() => ({})),
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: {
    Circle: 'Circle',
    Ellipse: 'Ellipse',
    G: 'G',
    Text: 'Text',
    TSpan: 'TSpan',
    TextPath: 'TextPath',
    Path: 'Path',
    Polygon: 'Polygon',
    Polyline: 'Polyline',
    Line: 'Line',
    Rect: 'Rect',
    Use: 'Use',
    Image: 'Image',
    Symbol: 'Symbol',
    Defs: 'Defs',
    LinearGradient: 'LinearGradient',
    RadialGradient: 'RadialGradient',
    Stop: 'Stop',
    ClipPath: 'ClipPath',
    Pattern: 'Pattern',
    Mask: 'Mask',
  },
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  Menu: 'Menu',
  X: 'X',
  Plus: 'Plus',
  Minus: 'Minus',
  Search: 'Search',
  Filter: 'Filter',
  Home: 'Home',
  Settings: 'Settings',
  User: 'User',
  LogOut: 'LogOut',
  Camera: 'Camera',
  MapPin: 'MapPin',
  Clock: 'Clock',
  Check: 'Check',
  Alert: 'Alert',
  Calendar: 'Calendar',
  Phone: 'Phone',
  Mail: 'Mail',
  Eye: 'Eye',
  EyeOff: 'EyeOff',
  Edit: 'Edit',
  Trash: 'Trash',
  Save: 'Save',
  Download: 'Download',
  Upload: 'Upload',
  Refresh: 'Refresh',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 667 }),
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: ({ children }) => children,
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: {},
      },
    },
    manifest: {},
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  requestBackgroundPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  getForegroundPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  getBackgroundPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => ({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0,
      accuracy: 5,
      altitudeAccuracy: 5,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  })),
  watchPositionAsync: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  requestCameraPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(() => ({
    canceled: false,
    assets: [{
      uri: 'mock-image-uri',
      fileName: 'mock-image.jpg',
      mimeType: 'image/jpeg',
      width: 100,
      height: 100,
    }],
  })),
  launchCameraAsync: jest.fn(() => ({
    canceled: false,
    assets: [{
      uri: 'mock-image-uri',
      fileName: 'mock-image.jpg',
      mimeType: 'image/jpeg',
      width: 100,
      height: 100,
    }],
  })),
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: ({ children }) => children,
  CameraView: ({ children }) => children,
  requestCameraPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  getCameraPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  CameraType: {
    front: 'front',
    back: 'back',
  },
  FlashMode: {
    on: 'on',
    off: 'off',
    auto: 'auto',
  },
}));

// Ignore react-native-specific modules

// Mock API constants for tests
jest.mock('@/constants/api', () => ({
  buildApiUrl: jest.fn((endpoint: string) => `http://localhost:3000/api${endpoint}`),
  getApiHeaders: jest.fn(() => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-client-info': 'pgn-mobile-client',
    'User-Agent': 'PGN-Mobile/1.0',
  })),
  API_BASE_URL: 'http://localhost:3000',
  API_ENDPOINTS: {
    LOGIN: "/auth/login",
    REFRESH_TOKEN: "/auth/refresh",
    LOGOUT: "/auth/logout",
    GET_USER: "/employees/me",
    EMPLOYEES: "/employees",
    EMPLOYEE_BY_ID: "/employees",
    ATTENDANCE_CHECKIN: "/attendance/checkin",
    ATTENDANCE_CHECKOUT: "/attendance/checkout",
    ATTENDANCE_STATUS: "/attendance/status",
  },
  API_HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
}));