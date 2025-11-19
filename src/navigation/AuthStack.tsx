import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import ForgetPasswordScreen from '../screens/Auth/ForgetPasswordScreen';
import OtpVerificationScreen from '../screens/Auth/OtpVerificationScreen';
import PricingScreen from '../screens/pricing/PricingScreen';
import { AuthStackParamList } from '@/common/types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ForgetPassword" component={ForgetPasswordScreen} />
    <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    <Stack.Screen name="Pricing" component={PricingScreen} />
  </Stack.Navigator>
);

export default AuthStack;