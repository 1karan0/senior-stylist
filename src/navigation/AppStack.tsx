import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from '@/navigation/MainTabNavigator';
import PricingScreen from '../screens/pricing/PricingScreen';
import { AppStackParamList } from '@/common/types';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    <Stack.Screen name="Pricing" component={PricingScreen} />
  </Stack.Navigator>
);

export default AppStack;