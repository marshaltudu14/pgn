import React from 'react';
import { View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '@/contexts/theme-context';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface RootThemeWrapperProps {
  children: React.ReactNode;
}

export function RootThemeWrapper({ children }: RootThemeWrapperProps) {
  const { resolvedTheme } = useTheme();
  const colors = useThemeColors();

  const navigationTheme = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={navigationTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {children}
          <StatusBar
            style={resolvedTheme === 'dark' ? 'light' : 'dark'}
          />
        </View>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}