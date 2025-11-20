import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '@/screens/onboarding/Onboarding';
import LoginScreen from '../screens/Auth/Login';
import SignupScreen from '../screens/Auth/Signup';
import ForgetPasswordScreen from '../screens/Auth/ForgetPassword';
import OtpVerificationScreen from '../screens/Auth/OtpVerification';
import PricingScreen from '../screens/pricing/Pricing';
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
