import { View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import './global.css';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <View className="flex-1">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </View>
  );
}
