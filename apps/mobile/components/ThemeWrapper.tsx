import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '@/contexts/theme-context';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { resolvedTheme } = useTheme();
  const colors = useThemeColors();

  const navigationTheme = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;

  // Update Android navigation bar when theme changes
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.background);
      NavigationBar.setButtonStyleAsync(resolvedTheme === 'dark' ? 'light' : 'dark');
    }
  }, [resolvedTheme, colors.background]);

  return (
    <ThemeProvider value={navigationTheme}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        {children}
        <StatusBar
          style={resolvedTheme === 'dark' ? 'light' : 'dark'}
        />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}