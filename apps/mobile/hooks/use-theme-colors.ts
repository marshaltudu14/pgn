import { useColorScheme } from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import { COLORS } from '@/constants';

export const useThemeColors = () => {
  const deviceColorScheme = useColorScheme();
  const { resolvedTheme } = useTheme();

  const colors = {
    background: resolvedTheme === 'dark' ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND_LIGHT,
    listBg: resolvedTheme === 'dark' ? COLORS.BACKGROUND_SECONDARY_DARK : COLORS.BACKGROUND_SECONDARY_LIGHT,
    text: resolvedTheme === 'dark' ? COLORS.TEXT_PRIMARY_DARK : COLORS.TEXT_PRIMARY_LIGHT,
    textSecondary: resolvedTheme === 'dark' ? COLORS.TEXT_SECONDARY_DARK : COLORS.TEXT_SECONDARY_LIGHT,
    textTertiary: resolvedTheme === 'dark' ? COLORS.TEXT_TERTIARY_DARK : COLORS.TEXT_TERTIARY_LIGHT,
    border: resolvedTheme === 'dark' ? COLORS.BORDER_DARK : COLORS.BORDER_LIGHT,
    separator: resolvedTheme === 'dark' ? COLORS.BORDER_DARK : COLORS.BORDER_LIGHT,
    primary: COLORS.SAFFRON,
    success: COLORS.SUCCESS,
    warning: COLORS.WARNING,
    error: COLORS.ERROR,
    errorBg: COLORS.ERROR_LIGHT,
    headerBg: resolvedTheme === 'dark' ? COLORS.BACKGROUND_SECONDARY_DARK : COLORS.SAFFRON,
    profileBg: resolvedTheme === 'dark' ? COLORS.BACKGROUND_SECONDARY_DARK : COLORS.SAFFRON_DARK,
    iconBg: resolvedTheme === 'dark' ? COLORS.BACKGROUND_SECONDARY_DARK : COLORS.BACKGROUND_SECONDARY_LIGHT,
    statusBar: resolvedTheme === 'dark' ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND_LIGHT,
  };

  return colors;
};