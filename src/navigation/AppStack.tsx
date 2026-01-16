import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserTabNavigator from '@/navigation/UserTabNavigator';
import ConsultantTabNavigator from '@/navigation/ConsultantTabNavigator';
import PricingScreen from '@/screens/pricing/Pricing';
import ConsultantChatScreen from '@/screens/consulant/chat/Conversation';
import { AppStackParamList } from '@/common/types';
import { useAuth } from '@/contexts/AuthContext';
import { useGetProfile } from '@/api/user/profile/useGetProfile';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role; // or 'customer'
  const [initialRoute, setInitialRoute] = useState<keyof AppStackParamList | undefined>(undefined);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  // Fetch profile data to check subscription status
  const { data: profileData, isLoading: isProfileLoading } = useGetProfile({
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Determine initial route based on user role and subscription status
  useEffect(() => {
    const determineInitialRoute = () => {
      if (!user) {
        setIsCheckingSubscription(false);
        return;
      }

      // Wait for profile data to load
      if (isProfileLoading) {
        return;
      }

      // For consultants, always go to ConsultantTabs
      if (userRole === 'consultant') {
        setInitialRoute('ConsultantTabs');
        setIsCheckingSubscription(false);
        return;
      }

      // For customers: Check subscription from profile API
      const subscription = profileData?.subscription;
      const hasSubscription = !!subscription;

      console.log('hasSubscription', subscription);

      if (!hasSubscription) {
        // No subscription - show Pricing screen
        setInitialRoute('Pricing');
      } else {
        // Has subscription - go to UserTabs
        setInitialRoute('UserTabs');
      }

      setIsCheckingSubscription(false);
    };

    determineInitialRoute();
  }, [user, userRole, profileData, isProfileLoading]);

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
