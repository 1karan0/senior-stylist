import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';
import Toast from '@/common/components/Toast';

export default function LoginScreen({ navigation }: any) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as any,
  });
  const { isDark } = useTheme();

  const { login } = useAuth();

  const insets = useSafeAreaInsets();

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  // Login Function
  const handleLogin = async (form: any) => {
    try {
      setLoading(true);
      await login(form.email, form.password);
      showToast('Login successful! Welcome back.', 'success');
    } catch (err: any) {
      console.log('signin error :', err);
      showToast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GradientBackground>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />

        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
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
                className={`font-bold text-[24px] ${isDark ? 'text-white' : 'text-textDark'} mt-4`}
              >
                Welcome Back
              </Text>

              <Text
                className={`font-normal text-[14px] ${
                  isDark ? 'text-textSecondary' : 'text-textMuted'
                }  mt-1`}
              >
                Sign in to continue to StyleHub
              </Text>
            </View>

            {/* Email */}
            <Text
              className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
            >
              Email Address
            </Text>

            <View
              className={`flex-row items-center border ${
                errors.email
                  ? 'border-red-500'
                  : isDark
                    ? 'bg-[#0E1B16] border-[#273F36]'
                    : 'bg-[#F5F9F7] border-[#DADADA]'
              } rounded-xl px-4 h-[52px] mb-1`}
            >
              <Image source={require('../../assets/icons/email.png')} className="w-5 h-5 mr-3" />

              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
                    className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'} `}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text className="text-red-500 text-[12px] mb-3 ml-1">
                {errors.email.message as string}
              </Text>
            )}

            {/* Password */}
            <Text
              className={`font-medium text-[14px] ${
                isDark ? 'text-[#ffff]' : 'text-black'
              } mb-2 mt-2`}
            >
              Password
            </Text>

            <View
              className={`flex-row items-center border ${
                errors.password
                  ? 'border-red-500'
                  : isDark
                    ? 'bg-[#0E1B16] border-[#273F36]'
                    : 'bg-[#F5F9F7] border-[#DADADA]'
              } rounded-xl px-4 h-[52px] mb-1`}
            >
              <Image source={require('../../assets/icons/lock.png')} className="w-5 h-5 mr-3" />

              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
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
            {errors.password && (
              <Text className="text-red-500 text-[12px] mb-3 ml-1">
                {errors.password.message as string}
              </Text>
            )}

            {/* Forgot Password */}
            <Pressable
              onPress={() => navigation.navigate('ForgetPassword')}
              className="mt-4 mb-6 self-end"
            >
              <Text className="font-normal text-[13px] text-textPrimary">Forgot Password?</Text>
            </Pressable>

            {/* Sign In Button */}
            <Pressable
              className="rounded-2xl overflow-hidden mb-6"
              onPress={handleSubmit(handleLogin)}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#94A3B8', '#64748B'] : ['#2CCB91', '#23A76F']}
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
                className={` ${
                  isDark ? 'text-textSecondary' : 'text-[#64748B]'
                } font-normal text-[14px]`}
              >
                Don't have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Signup', { user: 'customer' })}>
                <Text className="text-textPrimary">Sign Up</Text>
              </Pressable>
            </View>

            {/* Consultant */}
            <View className="flex-row justify-center mt-3">
              <Text
                className={`text-center ${
                  isDark ? 'text-white' : 'text-textDark'
                }  font-medium text-[14px]`}
              >
                Want to be a Consultant?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Signup', { user: 'consultant' })}>
                <Text className="text-textPrimary">Register here</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </GradientBackground>
    </SafeAreaView>
  );
}
