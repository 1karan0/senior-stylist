import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { AppStackParamList } from '@/common/types';
import { useAuth } from '@/contexts/AuthContext';

import UserTabNavigator from '@/navigation/UserTabNavigator';
import ConsultantTabNavigator from '@/navigation/ConsultantTabNavigator';
import PricingScreen from '@/screens/pricing/Pricing';
import ConsultantChatScreen from '@/screens/consulant/chat/Conversation';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack: React.FC = () => {
  const { user, isGuest } = useAuth();
  const userRole = user?.role; // or 'customer'
  const [initialRoute, setInitialRoute] = useState<keyof AppStackParamList | undefined>(undefined);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  const needsProfileForSubscription = Boolean(user) && !isGuest && userRole !== 'consultant';

  const { data: profileData, isLoading: isProfileLoading } = useGetProfile({
    enabled: needsProfileForSubscription,
  });

  const subscription = profileData?.subscription ?? null;
  const hasActiveSubscription = !!subscription;

  // Determine initial route based on user role and subscription status
  useEffect(() => {
    const determineInitialRoute = () => {
      // For guest users, go to UserTabs (which will show StoreTab)
      if (!user && isGuest) {
        setInitialRoute('UserTabs');
        setIsCheckingSubscription(false);
        return;
      }

      if (!user) {
        setIsCheckingSubscription(false);
        return;
      }

      // For consultants, always go to ConsultantTabs
      if (userRole === 'consultant') {
        setInitialRoute('ConsultantTabs');
        setIsCheckingSubscription(false);
        return;
      }

      // Customers: wait for profile — otherwise subscription is undefined and we incorrectly pick Pricing
      if (needsProfileForSubscription && isProfileLoading) {
        return;
      }

      if (hasActiveSubscription) {
        setInitialRoute('UserTabs');
        setIsCheckingSubscription(false);
        return;
      }

      setInitialRoute('Pricing');
      setIsCheckingSubscription(false);
    };

    determineInitialRoute();
  }, [
    user,
    isGuest,
    userRole,
    needsProfileForSubscription,
    isProfileLoading,
    hasActiveSubscription,
  ]);

  // Note: We use initialRouteName to set Pricing as the initial route
  // React Navigation handles the navigation automatically, no manual navigation needed

  // Show loading while checking subscription
  if (isCheckingSubscription) {
    return null; // Or a loading indicator
  }

  // Determine default initial route
  const defaultInitialRoute: keyof AppStackParamList =
    initialRoute || (userRole === 'consultant' ? 'ConsultantTabs' : 'UserTabs');

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={defaultInitialRoute}>
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
