import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/common/types';
import AuthGate from './AuthGate';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Root" component={AuthGate} />
    </Stack.Navigator>
  );
};

export default AppNavigation;
