import { View, Text, Image, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import { useResendVerificationCodeApi } from '@/api/auth/useResendCode';
import GradientBackground from '@/common/components/GradientBackground';

export default function ForgetPasswordScreen({ navigation }: any) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const sendOtpMutation = useResendVerificationCodeApi();

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      setApiError('');
      const res = await sendOtpMutation.mutateAsync({ email: data.email });
      if (!res.success) {
        setLoading(false);
        setApiError(res.message || 'Failed to send reset link. Please try again.');
        return;
      } else {
        setLoading(false);
        navigation.navigate('OtpVerification', { email: data.email });
      }
    } catch (err: any) {
      setLoading(false);
      setApiError(err.message || 'Something went wrong. Please try again.');
    }
  };

  const { isDark } = useTheme();

  return (
    <GradientBackground>
      <View className="flex-1 px-6">
        {/* Logo + Headings */}
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
            Forgot Password?
          </Text>

          <Text
            className={`font-normal text-[14px] ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} mt-1`}
          >
            No worries, we'll send you reset instructions
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

        <Text className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}>
          Email Address
        </Text>

        <View
          className={`flex-row items-center border ${
            errors.email
              ? 'border-red-500 bg-red-50/5'
              : isDark
                ? 'bg-[#0E1B16] border-[#273F36]'
                : 'bg-[#F5F9F7] border-[#DADADA]'
          } rounded-xl px-4 h-[52px] mb-1`}
        >
          <Image source={require('../../assets/icons/email.png')} className="w-5 h-5 mr-3" />

          <Controller
            control={control}
            name="email"
            defaultValue=""
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
                className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'}`}
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  if (apiError) setApiError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
        </View>

        {/* Field Error Message */}
        {errors.email && (
          <View className="flex-row items-center mb-4 px-1">
            <Text className="text-red-500 text-[18px] mr-1">•</Text>
            <Text className="text-red-500 text-[12px] font-medium">
              {errors.email.message as string}
            </Text>
          </View>
        )}

        {!errors.email && <View className="mb-5" />}

        {/* Send Reset Link Button */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          className="rounded-2xl overflow-hidden mb-6"
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#94A3B8', '#94A3B8'] : ['#2CCB91', '#23A76F']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            className="h-[50px] rounded-xl justify-center items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-urbanistBold text-[16px]">Send Reset Link</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} className="self-center">
          <Text className="font-normal text-[13px] text-[#27B07D]">Back to Login</Text>
        </Pressable>
      </View>
    </GradientBackground>
  );
}
