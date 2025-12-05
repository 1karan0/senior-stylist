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
import TextInputField from '@/common/components/TextInputField';

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
    console.log('button pressed ');
    if (data.password !== data.confirmPassword) {
      return; // Handled by validation below
    }

    if (!token) {
      showToast('Reset token is missing. Please request a new one.', 'error');
      return;
    }

    try {
      setLoading(true);
      await mutation.mutateAsync({ token, password: data.password });
      showToast('Password reset successful!', 'success');
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
              Reset Password
            </Text>

            <Text
              className={`font-normal text-[14px] ${
                isDark ? 'text-textSecondary' : 'text-textMuted'
              } mt-1`}
            >
              Set a new password for your account
            </Text>
          </View>

          {/* New Password */}

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
                label="New Password"
                placeholder="Enter new password"
                icon={require('../../assets/icons/lock.png')}
                value={value}
                onChangeText={onChange}
                isPassword={true}
                error={errors.password?.message as string}
              />
            )}
          />

          {/* Confirm Password */}
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Please confirm your password',
              validate: (value, formValues) =>
                value === formValues.password || 'Passwords do not match',
            }}
            render={({ field: { onChange, value } }) => (
              <TextInputField
                label="Confirm Password"
                placeholder="Confirm new password"
                icon={require('../../assets/icons/lock.png')}
                value={value}
                onChangeText={onChange}
                error={errors.confirmPassword?.message as string}
                isPassword={true}
              />
            )}
          />

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
  );
};

export default ResetPassword;
