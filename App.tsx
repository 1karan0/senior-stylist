import { View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import './global.css';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';

const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer>
            <View className="flex-1 bg-white dark:bg-black">
              <AppNavigator />
            </View>
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
