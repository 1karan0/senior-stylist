import React, { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import UserTabNavigator from '@/navigation/UserTabNavigator';
import ConsultantTabNavigator from '@/navigation/ConsultantTabNavigator';
import PricingScreen from '@/screens/pricing/Pricing';
import ConsultantChatScreen from '@/screens/consulant/chat/Conversation';
import { AppStackParamList } from '@/common/types';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role; // or 'customer'
  const [initialRoute, setInitialRoute] = useState<keyof AppStackParamList | undefined>(undefined);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const navigation = useNavigation<any>();

  // Determine initial route based on user role
  // Note: Login users ALWAYS go to UserTabs (never Pricing)
  // Pricing screen is only shown for new users after OTP verification
  useEffect(() => {
    const determineInitialRoute = async () => {
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

      // For customers: Check if this is a new signup (after OTP verification)
      // Only new signups should see Pricing screen
      try {
        const isNewSignup = await storage.getIsNewSignup();
        console.log('[AppStack] Checking signup status:', { isNewSignup, userRole });

        if (isNewSignup) {
          // New signup - show Pricing screen
          // Note: Don't clear the flag here - let Pricing screen clear it after checking
          console.log('[AppStack] New signup detected - navigating to Pricing');
          setInitialRoute('Pricing');
        } else {
          // Existing user (login) - always go to UserTabs
          console.log('[AppStack] Existing user (login) - navigating to UserTabs');
          setInitialRoute('UserTabs');
        }
      } catch (error) {
        console.error('[AppStack] Error checking signup status:', error);
        // Default to UserTabs on error (safer for login users)
        setInitialRoute('UserTabs');
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    determineInitialRoute();
  }, [user, userRole]);

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
