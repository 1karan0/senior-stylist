import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useResendVerificationCodeApi } from '@/api/auth/useResendCode';
import { useForgotPassword } from '@/api/auth/useForgotPasswod';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useVerifyForgotPassOtp } from '@/api/auth/useverifyForgotPassOtp';
import Toast from '@/common/components/Toast';
import { Button } from '@/common/components/Button';

export default function OtpVerificationScreen({ navigation, route }: any) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as any,
  });
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(true);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { verifyEmail } = useAuth();

  const isOtpComplete = otp.every((digit) => digit !== '');

  const { params } = route;
  const screen = params?.screen;
  const email = params?.email;

  // Call both hooks unconditionally to follow Rules of Hooks
  const resendVerificationMutation = useResendVerificationCodeApi();
  const forgotPasswordMutation = useForgotPassword();

  // Select the appropriate mutation based on screen
  const resendMutation = screen === 'signup' ? resendVerificationMutation : forgotPasswordMutation;

  const { isDark } = useTheme();

  const verifyForgotMutation = useVerifyForgotPassOtp();

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive]);

  const handleChange = (value: string, index: number) => {
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');

    setLoading(true);
    try {
      if (screen === 'signup') {
        // IMPORTANT: Set the flag BEFORE calling verifyEmail
        // This ensures the flag is set before AuthContext updates the user state
        // which triggers AppStack to mount and check the flag
        const { storage } = await import('@/services/storage');
        await storage.setIsNewSignup(true);

        const res = await verifyEmail(email, code);

        if (!res.success) {
          // If verification fails, clear the flag
          await storage.setIsNewSignup(false);
          showToast(res.error || 'Invalid verification code', 'error');
          return;
        }

        showToast('Email verified successfully!', 'success');
        // After email verification, user is set in AuthContext
        // AuthGate will switch from AuthStack to AppStack
        // AppStack will check the flag (already set above) and navigate to Pricing for new signups
        return;
      }

      // forgot password flow: call verify OTP mutation
      const resp = await verifyForgotMutation.mutateAsync({ email, code });

      // API may return different shapes; check common patterns
      if (resp?.success === false) {
        showToast(resp.message || 'Invalid verification code', 'error');
        return;
      }
      console.log('resp=====', resp);

      // If API provided a token for password reset, navigate to reset screen
      const resetToken = resp?.data?.token ?? resp?.token ?? resp?.reset_token;

      if (resetToken) {
        showToast('Code verified', 'success');
        setTimeout(() => {
          navigation.navigate('ResetPassword', { token: resetToken });
        }, 1500);
      } else {
        showToast('Verification successful!', 'success');
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      }
    } catch (err: any) {
      const msg = err?.message || 'Invalid verification code. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (isTimerActive) return;

    try {
      const res = await resendMutation.mutateAsync({ email: email });
      showToast('OTP has been resent successfully to your email.', 'success');

      // restart timer
      setTimer(30);
      setIsTimerActive(true);
    } catch (err: any) {
      const msg = err.message || 'Failed to resend OTP. Please try again.';
      showToast(msg, 'error');
    }
  };

  return (
    <GradientBackground className="flex-1 px-5 ">
      <View className="flex-1 items-center">
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />

        {/* Logo */}
        <Image
          source={
            isDark
              ? require('../../assets/icons/dark-logo.png')
              : require('../../assets/icons/colored_logo.png')
          }
          className="w-[90px] h-[90px] mt-14 mb-6"
          resizeMode="contain"
        />

        <Text className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-textDark'} `}>
          Enter OTP Verification Code
        </Text>

        <Text className={`text-[13px] ${isDark ? 'text-textSecondary' : 'text-textMuted'}  mt-2`}>
          Verification code has been sent to
        </Text>

        <Text
          className={`text-[14px] font-semibold ${isDark ? 'text-[#2CCB91]' : 'text-textPrimary'} mt-1`}
        >
          {email}
        </Text>

        {/* OTP BOXES */}
        <View className="flex-row justify-center gap-2 mt-6 mb-4">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && otp[i] === '' && i > 0) {
                  inputRefs.current[i - 1]?.focus();
                  const updated = [...otp];
                  updated[i - 1] = '';
                  setOtp(updated);
                }
              }}
              maxLength={1}
              keyboardType="number-pad"
              className={`w-12 h-14 border border-textPrimary ${
                isDark ? 'bg-commonGradientStop6 text-white' : 'bg-white text-black'
              } rounded-md mx-1 text-center text-[20px]  `}
            />
          ))}
        </View>

        {/* Resend */}
        <View className="flex-row mb-6">
          <Text className={` ${isDark ? 'text-textSecondary' : 'text-[#6B6B6B]'} text-[13px]`}>
            Didn't receive the code?{' '}
          </Text>

          {isTimerActive ? (
            <Text className="text-[#2CCB91] font-semibold text-[13px]">Resend in {timer}s</Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text className="text-[#2CCB91] font-semibold text-[13px]">Resend</Text>
            </Pressable>
          )}
        </View>

        {/* Verify */}
        <View className="w-full">
          <Button
            text="Verify"
            onPress={handleVerify}
            disabled={!isOtpComplete}
            loading={loading}
            variant="gradient"
          />
          <View className="mt-5">
            {/* Go Back */}
            <Button
              text="Go Back"
              onPress={() => navigation.goBack()}
              variant="light"
              className={`rounded-[10px] ${isDark ? 'bg-[#0E1B17] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DAE7E0]'} border`}
              textClassName={`${isDark ? 'text-[#ffffff]' : 'text-[#162721]'} text-base font-urbanist-bold`}
            />
          </View>
        </View>
      </View>
    </GradientBackground>
  );
}
