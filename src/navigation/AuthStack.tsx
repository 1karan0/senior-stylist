import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '@/screens/onboarding/Onboarding';
import LoginWithMailScreen from '../screens/Auth/LoginWithMail';
import SignupScreen from '../screens/Auth/Signup';
import ForgetPasswordScreen from '../screens/Auth/ForgetPassword';
import OtpVerificationScreen from '../screens/Auth/OtpVerification';
import PricingScreen from '../screens/pricing/Pricing';
import { AuthStackParamList } from '@/common/types';
import ResetPassword from '@/screens/Auth/ResetPassword';
import { storage } from '@/services/storage';
import MainLoginScreen from '@/screens/Auth/MainLogin';
import LoginWithPhoneScreen from '@/screens/Auth/LoginWithPhone';
import PhoneOtpScreen from '@/screens/Auth/PhoneOtp';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<keyof AuthStackParamList | undefined>(undefined);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const isOnboardingCompleted = await storage.getOnbordingCompleted();
        // If onboarding is completed, start with Login screen
        // Otherwise, start with Onboarding screen
        setInitialRoute(isOnboardingCompleted ? 'MainLogin' : 'Onboarding');
      } catch (error) {
        console.error('[AuthStack] Error checking onboarding status:', error);
        // Default to Onboarding on error
        setInitialRoute('Onboarding');
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Show nothing while checking onboarding status
  if (isCheckingOnboarding) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute || 'Onboarding'}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainLogin" component={MainLoginScreen} />
      <Stack.Screen name="LoginWithMail" component={LoginWithMailScreen} />
      <Stack.Screen name="PhoneOtp" component={PhoneOtpScreen} />
      <Stack.Screen name="LoginWithPhone" component={LoginWithPhoneScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgetPassword" component={ForgetPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
