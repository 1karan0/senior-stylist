// App.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import './global.css';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AdProvider } from '@/contexts/AdContext';
import { initializeFirebase } from '@/services/firebase';
import NotificationHandler from '@/components/notifications/NotificationHandler';
import ForceUpdateScreen from '@/screens/ForceUpdateScreen';
import { useAppVersionCheck } from '@/hooks/useAppVersionCheck';

// Verify React Native Firebase is available (auto-initializes from google-services.json)
initializeFirebase();

const queryClient = new QueryClient();

// Inner app component that uses React Query hooks
const AppContent = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const { isChecking, forceUpdateRequired } = useAppVersionCheck();

  // Handle initial app loading
  useEffect(() => {
    const initialize = async () => {
      // Version check happens automatically in the hook
      // Wait a bit to ensure version check completes
      setTimeout(() => {
        setIsInitializing(false);
      }, 500);
    };

    initialize();
  }, []);

  // Show loading while checking version
  if (isInitializing || isChecking) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Show force update screen if required
  if (forceUpdateRequired) {
    return <ForceUpdateScreen />;
  }

  // Normal app flow
  return (
    <ThemeProvider>
      <AdProvider>
        <AuthProvider>
          <NavigationContainer>
            <View className="flex-1 bg-white dark:bg-black">
              <AppNavigator />
              <NotificationHandler />
            </View>
          </NavigationContainer>
        </AuthProvider>
      </AdProvider>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
