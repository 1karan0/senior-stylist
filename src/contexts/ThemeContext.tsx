import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme from AsyncStorage on mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('user-theme');
        if (savedTheme) {
          setTheme(savedTheme as ThemeMode);
        } else {
        }
      } catch (error) {
        console.error('🔧 ThemeProvider - Failed to load theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedTheme();
  }, []);

  // Save theme to AsyncStorage when it changes
  useEffect(() => {
    const saveTheme = async () => {
      if (!isLoaded) {
        return; // Don't save on initial load
      }
      try {
        await AsyncStorage.setItem('user-theme', theme);
      } catch (error) {
        console.error('🔧 ThemeProvider - Failed to save theme:', error);
      }
    };
    saveTheme();
  }, [theme, isLoaded]);

  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const value: ThemeContextType = {
    theme,
    setTheme,
    isDark,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
