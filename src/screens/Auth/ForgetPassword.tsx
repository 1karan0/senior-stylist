import { Controller, useForm } from 'react-hook-form';
import { useForgotPassword } from '@/api/auth/useForgotPasswod';
import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';
import Toast from '@/common/components/Toast';

import { View, Text, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function ForgetPassword({ navigation }: any) {
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
  const sendOtpMutation = useForgotPassword();
  const { isDark } = useTheme();

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const res = await sendOtpMutation.mutateAsync({ email: data.email });
      console.log('ress--===', res);

      showToast('Verification code sent to your email!', 'success');
      setTimeout(() => {
        navigation.navigate('OtpVerification', { email: data.email, screen: 'forgotPassword' });
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.message || 'Something went wrong. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />

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
            className={`font-normal text-[14px] ${
              isDark ? 'text-[#8AA897]' : 'text-[#658176]'
            } mt-1`}
          >
            No worries, we'll send you reset instructions
          </Text>
        </View>

        <Text className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}>
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
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
        </View>

        {/* Field Error Message */}
        {errors.email && (
          <Text className="text-red-500 text-[12px] mb-4 ml-1">
            {errors.email.message as string}
          </Text>
        )}

        {!errors.email && <View className="mb-5" />}

        {/* Send Reset Link Button */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          className="rounded-2xl overflow-hidden mb-6"
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
              <Text className="text-white font-bold text-[16px]">Send Reset Link</Text>
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
