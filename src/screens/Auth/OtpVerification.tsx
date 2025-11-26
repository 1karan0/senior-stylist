import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useResendVerificationCodeApi } from '@/api/auth/useResendCode';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useVerifyForgotPassOtp } from '@/api/auth/useverifyForgotPassOtp';
import Toast from '@/common/components/Toast';

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
  const resendMutation = useResendVerificationCodeApi();

  const { isDark } = useTheme();

  const email = route.params.email;
  const screen = route.params.screen;
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
        const res = await verifyEmail(email, code);

        if (!res.success) {
          showToast(res.error || 'Invalid verification code', 'error');
          return;
        }

        showToast('Email verified successfully! Welcome aboard.', 'success');
        setTimeout(() => {
          navigation.navigate('UserApp');
        }, 1500);
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
        showToast('Code verified! Redirecting to reset password...', 'success');
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
    <GradientBackground className="flex-1 px-6 items-center">
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

      <Text className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#162721]'} `}>
        Enter OTP Verification Code
      </Text>

      <Text className={`text-[13px] ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}  mt-2`}>
        Verification code has been sent to
      </Text>

      <Text
        className={`text-[14px] font-semibold ${isDark ? 'text-[#2CCB91]' : 'text-[#27B07D]'} mt-1`}
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
            className={`w-12 h-12 border border-[#27B07D] ${
              isDark ? 'bg-[#0E1B16] text-white' : 'bg-white text-black'
            } rounded-md mx-1 text-center text-[20px]  `}
          />
        ))}
      </View>

      {/* Resend */}
      <View className="flex-row mb-6">
        <Text className={` ${isDark ? 'text-[#8AA897]' : 'text-[#6B6B6B]'} text-[13px]`}>
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
      <Pressable
        disabled={!isOtpComplete || loading}
        onPress={handleVerify}
        className="w-full rounded-xl overflow-hidden mb-4"
      >
        {isOtpComplete ? (
          <LinearGradient
            colors={loading ? ['#94A3B8', '#64748B'] : ['#2CCB91', '#23A76F']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            className="h-[50px] rounded-xl justify-center items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-[16px]">Verify</Text>
            )}
          </LinearGradient>
        ) : (
          <View
            className={`h-[50px] rounded-xl justify-center items-center  ${
              isDark ? 'bg-[#8AA897]' : 'bg-[#DADADA]'
            }`}
          >
            <Text className="text-white font-bold text-[16px]">Verify</Text>
          </View>
        )}
      </Pressable>

      {/* Go Back */}
      <Pressable
        onPress={() => navigation.goBack()}
        className={`w-full h-[50px] rounded-xl border  ${
          isDark ? 'bg-[#0E1B16] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
        } justify-center items-center`}
      >
        <Text className={`text-[15px]  ${isDark ? 'text-white' : 'text-[#162721]'} font-bold`}>
          Go Back
        </Text>
      </Pressable>
    </GradientBackground>
  );
}
