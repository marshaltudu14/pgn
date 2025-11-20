/**
 * PGN Mobile App Theme and Color Constants
 * Centralized theme configuration for both light and dark modes
 */

import { Platform } from 'react-native';

// Primary brand colors
export const COLORS = {
  // Primary brand colors
  SAFFRON: '#FF9933',
  SAFFRON_DARK: '#E68A00',
  SAFFRON_LIGHT: '#FFB366',
  SAFFRON_ALPHA_DARK: '#FF993320',
  SAFFRON_ALPHA_LIGHT: '#FF993315',

  // Status colors
  SUCCESS: '#10B981',
  SUCCESS_LIGHT: '#D1FAE5',
  ERROR: '#EF4444',
  ERROR_LIGHT: '#FEF2F2',
  WARNING: '#F59E0B',
  WARNING_LIGHT: '#FEF3C7',

  // Text colors
  TEXT_PRIMARY_DARK: '#FFFFFF',
  TEXT_PRIMARY_LIGHT: '#000000',
  TEXT_SECONDARY_DARK: '#D1D5DB',
  TEXT_SECONDARY_LIGHT: '#374151',
  TEXT_TERTIARY_DARK: '#9CA3AF',
  TEXT_TERTIARY_LIGHT: '#6B7280',
  TEXT_DISABLED_DARK: '#6B7280',
  TEXT_DISABLED_LIGHT: '#9CA3AF',

  // Background colors
  BACKGROUND_DARK: '#000000',
  BACKGROUND_LIGHT: '#FFFFFF',
  BACKGROUND_SECONDARY_DARK: '#18181B',
  BACKGROUND_SECONDARY_LIGHT: '#F9FAFB',

  // Border colors
  BORDER_DARK: '#374151',
  BORDER_LIGHT: '#D1D5DB',

  // Info colors
  INFO: '#3B82F6',
  INFO_LIGHT: '#DBEAFE',

  // Legacy theme colors for compatibility
  LEGACY_TEXT_LIGHT: '#11181C',
  LEGACY_TEXT_DARK: '#ECEDEE',
  LEGACY_BACKGROUND_LIGHT: '#fff',
  LEGACY_BACKGROUND_DARK: '#151718',
  LEGACY_ICON_LIGHT: '#687076',
  LEGACY_ICON_DARK: '#9BA1A6',
  LEGACY_TAB_ICON_DEFAULT_LIGHT: '#687076',
  LEGACY_TAB_ICON_DEFAULT_DARK: '#9BA1A6',
} as const;

// Legacy Colors object for backward compatibility
export const Colors = {
  light: {
    text: COLORS.LEGACY_TEXT_LIGHT,
    background: COLORS.LEGACY_BACKGROUND_LIGHT,
    tint: COLORS.SAFFRON,
    icon: COLORS.LEGACY_ICON_LIGHT,
    tabIconDefault: COLORS.LEGACY_TAB_ICON_DEFAULT_LIGHT,
    tabIconSelected: COLORS.SAFFRON,
  },
  dark: {
    text: COLORS.LEGACY_TEXT_DARK,
    background: COLORS.LEGACY_BACKGROUND_DARK,
    tint: COLORS.SAFFRON,
    icon: COLORS.LEGACY_ICON_DARK,
    tabIconDefault: COLORS.LEGACY_TAB_ICON_DEFAULT_DARK,
    tabIconSelected: COLORS.SAFFRON,
  },
};

// Theme configuration
export const THEME = {
  COLORS,
  BORDER_RADIUS: {
    SMALL: 8,
    MEDIUM: 12,
    LARGE: 16,
    XLARGE: 20,
    ROUND: 40,
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  FONT_SIZES: {
    XS: 12,
    SM: 14,
    BASE: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    TITLE: 28,
    DISPLAY: 30,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
