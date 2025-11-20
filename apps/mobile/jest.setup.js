/* eslint-env jest */

// Add React Native development globals that are preset expects
global.__DEV__ = true;

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

global.beforeEach(() => {
  console.error = global.jest.fn();
  console.warn = global.jest.fn();
});

global.afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock react-native-reanimated to prevent native driver issues
global.jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-screens
global.jest.mock('react-native-screens', () => ({
  enableScreens: global.jest.fn(),
  screensEnabled: global.jest.fn(),
}));

// Mock @react-navigation/native
global.jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: global.jest.fn(),
    replace: global.jest.fn(),
    dispatch: global.jest.fn(),
    goBack: global.jest.fn(),
    setOptions: global.jest.fn(),
  }),
  useRoute: () => ({
    params: {},
    name: 'mock-route',
    key: 'mock-key',
  }),
  useFocusEffect: global.jest.fn(),
  useIsFocused: global.jest.fn(() => true),
  createNavigationContainerRef: global.jest.fn(),
  NavigationContainer: ({ children }) => children,
}));

// Mock expo-router
global.jest.mock('expo-router', () => ({
  router: {
    push: global.jest.fn(),
    replace: global.jest.fn(),
    back: global.jest.fn(),
    navigate: global.jest.fn(),
    canGoBack: global.jest.fn(() => true),
  },
  useLocalSearchParams: global.jest.fn(() => ({})),
  useSegments: global.jest.fn(() => []),
  useFocusEffect: global.jest.fn(),
  usePathname: global.jest.fn(() => '/test'),
}));

// Mock React Native Alert and other native modules
global.jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: global.jest.fn((obj) => obj.ios),
  },
  useColorScheme: global.jest.fn(),
  Dimensions: {
    get: global.jest.fn(() => ({ width: 375, height: 667, scale: 2, fontScale: 1 })),
  },
  PixelRatio: {
    get: global.jest.fn(() => 2),
    getFontScale: global.jest.fn(() => 1),
    getPixelSizeForLayoutSize: global.jest.fn((layoutSize) => layoutSize * 2),
    roundToNearestPixel: global.jest.fn((layoutSize) => layoutSize),
  },
  Alert: {
    alert: global.jest.fn(),
  },
  StyleSheet: {
    create: global.jest.fn((styles) => styles),
    flatten: global.jest.fn((style) => style),
    compose: global.jest.fn((style1, style2) => ({ ...style1, ...style2 })),
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  Pressable: 'Pressable',
  TouchableOpacity: 'TouchableOpacity',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  Animated: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image',
    ScrollView: 'Animated.ScrollView',
    Value: global.jest.fn(),
    event: global.jest.fn(),
    timing: global.jest.fn(() => ({ start: global.jest.fn() })),
    spring: global.jest.fn(() => ({ start: global.jest.fn() })),
    decay: global.jest.fn(() => ({ start: global.jest.fn() })),
    seq: global.jest.fn(),
    parallel: global.jest.fn(),
    stagger: global.jest.fn(),
    delay: global.jest.fn(),
  },
}));

// Mock TurboModuleRegistry to handle missing native modules
global.jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: global.jest.fn(() => ({})),
  getEnforcing: global.jest.fn(() => ({})),
}));

// Mock react-native-svg for lucide icons
global.jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
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
}));

// Mock lucide-react-native icons
global.jest.mock('lucide-react-native', () => ({
  Mail: 'Mail',
  X: 'X',
  ChevronRight: 'ChevronRight',
  ChevronLeft: 'ChevronLeft',
  Eye: 'Eye',
  EyeOff: 'EyeOff',
  User: 'User',
  MapPin: 'MapPin',
  Phone: 'Phone',
  Lock: 'Lock',
  Check: 'Check',
  AlertCircle: 'AlertCircle',
  Info: 'Info',
}));

// Import React Native Testing Library matchers
require('@testing-library/jest-native/extend-expect');