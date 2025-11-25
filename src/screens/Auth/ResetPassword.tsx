import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { AuthStackParamList } from '@/common/types';
import { useResetPassword } from '@/api/auth/useResetPassword';
import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';
import Toast from '@/common/components/Toast';

const ResetPassword = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as any,
  });
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const token = route.params?.token;

  const { isDark } = useTheme();
  const mutation = useResetPassword();
  const insets = useSafeAreaInsets();

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const onSubmit = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      return; // Handled by validation below
    }

    if (!token) {
      showToast('Reset token is missing. Please request a new one.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await mutation.mutateAsync({ token, password: data.password });
      console.log('res====', res, token);
      showToast('Password reset successful! Redirecting to login...', 'success');
      setTimeout(() => {
        navigation.navigate('Login' as never);
      }, 1500);
    } catch (err: any) {
      showToast(err?.message || 'Failed to reset password. Please try again.', 'error');
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
                className={`font-bold text-[24px] ${isDark ? 'text-white' : 'text-[#162721]'} mt-4`}
              >
                Welcome Back
              </Text>

              <Text
                className={`font-normal text-[14px] ${
                  isDark ? 'text-[#8AA897]' : 'text-[#658176]'
                } mt-1`}
              >
                Reset your StyleHub password
              </Text>
            </View>

            {/* Title */}
            <Text
              className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#162721]'} mb-2`}
            >
              Reset Password
            </Text>

            <Text className={`text-[14px] ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} mb-6`}>
              Set a new password for your account
            </Text>

            {/* New Password */}
            <Text
              className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
            >
              New Password
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
                    placeholder="Enter new password"
                    placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
                    secureTextEntry={!showPassword}
                    className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'}`}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
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

            {/* Confirm Password */}
            <Text
              className={`font-medium text-[14px] ${
                isDark ? 'text-[#ffff]' : 'text-black'
              } mb-2 mt-2`}
            >
              Confirm Password
            </Text>

            <View
              className={`flex-row items-center border ${
                errors.confirmPassword
                  ? 'border-red-500'
                  : isDark
                    ? 'bg-[#0E1B16] border-[#273F36]'
                    : 'bg-[#F5F9F7] border-[#DADADA]'
              } rounded-xl px-4 h-[52px] mb-1`}
            >
              <Image source={require('../../assets/icons/lock.png')} className="w-5 h-5 mr-3" />

              <Controller
                control={control}
                name="confirmPassword"
                rules={{
                  required: 'Please confirm your password',
                  validate: (value, formValues) =>
                    value === formValues.password || 'Passwords do not match',
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Confirm new password"
                    placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
                    secureTextEntry={!showConfirmPassword}
                    className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'}`}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Image
                  source={
                    showConfirmPassword
                      ? require('../../assets/icons/eye-open.png')
                      : require('../../assets/icons/eye-closed.png')
                  }
                  className="w-5 h-5 ml-2"
                />
              </Pressable>
            </View>
            {errors.confirmPassword && (
              <Text className="text-red-500 text-[12px] mb-3 ml-1">
                {errors.confirmPassword.message as string}
              </Text>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              className="rounded-2xl overflow-hidden mt-4"
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#94A3B8', '#64748B'] : ['#2CCB91', '#23A76F']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                className="h-[50px] rounded-xl items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-[16px] font-semibold">Reset Password</Text>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </GradientBackground>
    </SafeAreaView>
  );
};

export default ResetPassword;
