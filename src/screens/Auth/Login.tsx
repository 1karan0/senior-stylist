import React, { useState } from 'react';
import { View, Text, Pressable, Image, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import Toast from '@/common/components/Toast';
import TextInputField from '@/common/components/TextInputField';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginScreen({ navigation }: any) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
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
                <TextInputField
                  label="Email Address"
                  placeholder="Enter your email"
                  icon={require('@/assets/icons/email.png')}
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message as string}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

            {/* Password */}

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
                <TextInputField
                  label="Password"
                  placeholder="Enter your password"
                  icon={require('../../assets/icons/lock.png')}
                  value={value}
                  onChangeText={onChange}
                  isPassword={true}
                  error={errors.password?.message as string}
                />
              )}
            />

            {/* Forgot Password */}
            <Pressable
              onPress={() => navigation.navigate('ForgetPassword')}
              className="mt-4 mb-6 self-end"
            >
              <Text className="font-normal text-[13px] text-textPrimary">Forgot Password?</Text>
            </Pressable>

            {/* Sign In Button */}
            <Button
              text="Sign In"
              onPress={handleSubmit(handleLogin)}
              loading={loading}
              disabled={loading}
              variant="gradient"
              className="h-[50px] rounded-xl w-full mb-6"
              textClassName="text-[16px] font-bold"
            />

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
