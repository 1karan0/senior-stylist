import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { useAuth } from '@/contexts/AuthContext';
import GradientBackground from '@/common/components/GradientBackground';

export default function AuthGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <GradientBackground className="flex-1 items-center justify-center">
        <View className=" ">
          <ActivityIndicator size="large" />
        </View>
      </GradientBackground>
    );
  }

  return user ? <AppStack /> : <AuthStack />;
}
