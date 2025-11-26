import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserTabNavigator from '@/navigation/UserTabNavigator';
import ConsultantTabNavigator from '@/navigation/ConsultantTabNavigator';
import PricingScreen from '@/screens/pricing/Pricing';
import ConsultantChatScreen from '@/screens/consulant/chat/Conversation';
import { AppStackParamList } from '@/common/types';
import { useAuth } from '@/contexts/AuthContext';

const Stack = createNativeStackNavigator<AppStackParamList>();

// This should come from your navigation route or context
// For now, we'll use a simple variable

const AppStack: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role; // or 'customer'
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Conditionally show only one tab navigator based on user role */}
      {userRole === 'consultant' ? (
        <Stack.Screen name="ConsultantTabs" component={ConsultantTabNavigator} />
      ) : (
        <Stack.Screen name="UserTabs" component={UserTabNavigator} />
      )}
      {/* Shared chat screen (used by both consultants and customers) */}
      <Stack.Screen name="ConsultantChat" component={ConsultantChatScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
    </Stack.Navigator>
  );
};

export default AppStack;
