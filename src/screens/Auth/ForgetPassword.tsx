import { Controller, useForm } from 'react-hook-form';
import { useForgotPassword } from '@/api/auth/useForgotPasswod';
import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';
import Toast from '@/common/components/Toast';

import { View, Text, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import TextInputField from '@/common/components/TextInputField';
import Button from '@/common/components/Button';

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

          <Text className={`font-bold text-[24px] ${isDark ? 'text-white' : 'text-textDark'} mt-4`}>
            Forgot Password?
          </Text>

          <Text
            className={`font-normal text-[14px] ${
              isDark ? 'text-textSecondary' : 'text-textMuted'
            } mt-1`}
          >
            No worries, we'll send you reset instructions
          </Text>
        </View>

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
            <TextInputField
              label="Email Adress"
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={require('@/assets/icons/email.png')}
              error={errors.email?.message as string}
            />
          )}
        />

        {!errors.email && <View className="mb-5" />}

        {/* Send Reset Link Button */}
        <Button
          text="Send Verification Code"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={loading}
          className="rounded-2xl mb-6 h-[50px] justify-center items-center"
          textClassName="text-[16px] font-bold"
        />

        <Pressable onPress={() => navigation.navigate('Login')} className="self-center">
          <Text className="font-normal text-[13px] text-textPrimary">Back to Login</Text>
        </Pressable>
      </View>
    </GradientBackground>
  );
}
