import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('light');

  const resolvedTheme = theme;

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme');
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
          setThemeState(savedTheme as Theme);
        } else {
          // If no saved theme, use system theme as default
          const systemTheme = deviceColorScheme || 'light';
          setThemeState(systemTheme as Theme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // Fallback to system theme on error
        const systemTheme = deviceColorScheme || 'light';
        setThemeState(systemTheme as Theme);
      }
    };

    loadTheme();
  }, [deviceColorScheme]);

  // Update system UI elements when theme changes
  useEffect(() => {
    const updateSystemUI = async () => {
      if (Platform.OS === 'android') {
        try {
          // Use setStyle for edge-to-edge compatibility
          // setPositionAsync and setBackgroundColorAsync are deprecated with edge-to-edge enabled
          await NavigationBar.setStyle(resolvedTheme === 'dark' ? 'dark' : 'light');
        } catch (error) {
          console.warn('Failed to update navigation bar:', error);
        }
      }
    };

    updateSystemUI();
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};