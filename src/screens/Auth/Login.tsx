import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';

export default function LoginScreen({ navigation }: any) {
  const { control, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const { isDark } = useTheme();

  const { login } = useAuth();

  const insets = useSafeAreaInsets();
  // Login Function
  const handleLogin = async (form: any) => {
    try {
      setLoading(true);
      await login(form.email, form.password);
    } catch (err: any) {
      setLoading(false);
      console.log('signin error :', err);
      setApiError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GradientBackground>
        <KeyboardAvoidingView>
          <ScrollView
            contentContainerStyle={{
              paddingBottom: insets.bottom + 20,
              flexGrow: 1,
            }}
            className="px-6"
          >
            {/* Logo & Header */}
            <View className="items-center mt-14 mb-10">
              <Image
                source={
                  isDark
                    ? require('../../assets/icons/dark-logo.png')
                    : require('../../assets/icons/colored_logo.png')
                }
                className="w-[90px] h-[90px]"
                resizeMode="contain"
              />

              <Text
                className={`font-bold text-[24px] ${isDark ? 'text-white' : 'text-[#162721]'} mt-4`}
              >
                Welcome Back
              </Text>

              <Text
                className={`font-normal text-[14px] ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}  mt-1`}
              >
                Sign in to continue to StyleHub
              </Text>
            </View>
            {/* API Error Message */}
            {apiError ? (
              <View
                className={`flex-row items-center ${isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'} border rounded-xl px-4 py-3 mb-4`}
              >
                <Text className="text-red-500 text-[20px] mr-2">⚠</Text>
                <Text
                  className={`flex-1 ${isDark ? 'text-red-400' : 'text-red-600'} text-[13px] font-medium`}
                >
                  {apiError}
                </Text>
              </View>
            ) : null}

            {/* Email */}
            <Text
              className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
            >
              Email Address
            </Text>

            <View
              className={`flex-row items-center border  ${isDark ? 'bg-[#0E1B16] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DADADA]'}  rounded-xl px-4 h-[52px] mb-5`}
            >
              <Image source={require('../../assets/icons/email.png')} className="w-5 h-5 mr-3" />

              <Controller
                control={control}
                name="email"
                rules={{ required: 'Email is required' }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={` ${isDark ? '#8AA897' : '#94A3B8'}`}
                    className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'} `}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                  />
                )}
              />
            </View>

            {/* Password */}
            <Text
              className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
            >
              Password
            </Text>

            <View
              className={`flex-row items-center border  ${isDark ? 'bg-[#0E1B16] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DADADA]'}  rounded-xl px-4 h-[52px] mb-5`}
            >
              <Image source={require('../../assets/icons/lock.png')} className="w-5 h-5 mr-3" />

              <Controller
                control={control}
                name="password"
                rules={{ required: 'Password is required' }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor={` ${isDark ? '#8AA897' : '#94A3B8'}`}
                    secureTextEntry={!showPassword}
                    className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'} `}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />

              {/* Toggle eye button */}
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Image
                  source={
                    showPassword
                      ? require('../../assets/icons/eye-open.png')
                      : require('../../assets/icons/eye-closed.png')
                  }
                  className="w-5 h-5 ml-2"
                />
              </Pressable>
            </View>

            {/* Forgot Password */}
            <Pressable
              onPress={() => navigation.navigate('ForgetPassword')}
              className="mt-4 mb-6 self-end"
            >
              <Text className="font-normal text-[13px] text-[#27B07D]">Forgot Password?</Text>
            </Pressable>

            {/* Sign In Button */}
            <Pressable
              className="rounded-2xl overflow-hidden mb-6"
              onPress={handleSubmit(handleLogin)}
              disabled={loading}
            >
              <LinearGradient
                colors={['#2CCB91', '#23A76F']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                className="h-[50px] rounded-xl justify-center items-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-[16px]">Sign In</Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Sign Up */}
            <View className="flex-row justify-center">
              <Text
                className={` ${isDark ? 'text-[#8AA897]' : 'text-[#64748B]'} font-normal text-[14px]`}
              >
                Don’t have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Signup', { user: 'customer' })}>
                <Text className="text-[#27B07D]">Sign Up</Text>
              </Pressable>
            </View>

            {/* Consultant */}
            <View className="flex-row justify-center mt-3">
              <Text
                className={`text-center ${isDark ? 'text-white' : 'text-[#162721]'}  font-medium text-[14px]`}
              >
                Want to be a Consultant?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Signup', { user: 'consultant' })}>
                <Text className="text-[#27B07D]">Register here</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </GradientBackground>
    </SafeAreaView>
  );
}
