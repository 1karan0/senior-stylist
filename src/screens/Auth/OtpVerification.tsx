import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useForgotPassword } from '@/api/auth/useForgotPasswod';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useVerifyForgotPassOtp } from '@/api/auth/useverifyForgotPassOtp';
import Toast from '@/common/components/Toast';
import { Button } from '@/common/components/Button';
import InfoModal from '@/common/components/modals/InfoModal';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import {
  initializeFirebase,
  sendPhoneVerificationCode,
  verifyPhoneOtpCode,
} from '@/services/firebase';

function maskE164(e164: string) {
  const s = e164.trim();
  if (s.length <= 6) return s;
  return `${s.slice(0, 4)} •••• ••${s.slice(-4)}`;
}

export default function OtpVerificationScreen({ navigation, route }: any) {
  const { params } = route;
  const screen = params?.screen;
  const email = params?.email;
  const phoneE164 = params?.phoneE164 as string | undefined;
  const isSignupScreen = screen === 'signup';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as any,
  });
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(!isSignupScreen);
  const [showAdminVerificationModal, setShowAdminVerificationModal] = useState(false);

  const [verificationId, setVerificationId] = useState('');
  const [sendingInitialSms, setSendingInitialSms] = useState(isSignupScreen);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { verifyEmail } = useAuth();

  const isOtpComplete = otp.every((digit) => digit !== '');

  const { horizontalPadding } = useTabletLayout();

  const forgotPasswordMutation = useForgotPassword();

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

  useEffect(() => {
    if (!isSignupScreen) return;
    if (!phoneE164) {
      setSendingInitialSms(false);
      showToast('Phone number missing. Go back and try again.', 'error');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        initializeFirebase();
        const id = await sendPhoneVerificationCode(phoneE164);
        if (!cancelled) {
          setVerificationId(id);
          setTimer(30);
          setIsTimerActive(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          showToast(err?.message || 'Failed to send verification code.', 'error');
        }
      } finally {
        if (!cancelled) {
          setSendingInitialSms(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignupScreen, phoneE164]);

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

        if (!verificationId) {
          await storage.setIsNewSignup(false);
          showToast('Please wait for the SMS code to be sent.', 'error');
          return;
        }

        const res = await verifyEmail(email, code, verificationId);
        console.log('res======> from screen ', res);

        if (!res.success) {
          // If verification fails, clear the flag
          await storage.setIsNewSignup(false);
          showToast(res.error || 'Invalid verification code', 'error');
          return;
        }

        // Check if consultant requires admin verification
        if (res.requiresAdminVerification) {
          // Clear the signup flag since consultant can't proceed yet
          await storage.setIsNewSignup(false);
          // Show admin verification modal
          setShowAdminVerificationModal(true);
          return;
        }

        showToast('Phone verified successfully!', 'success');
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
      if (screen === 'signup') {
        if (!phoneE164) {
          showToast('Phone number missing. Go back and try again.', 'error');
          return;
        }
        setLoading(true);
        initializeFirebase();
        const id = await sendPhoneVerificationCode(phoneE164);
        console.log('id--===', id);
        setVerificationId(id);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setTimer(30);
        setIsTimerActive(true);
        showToast('A new verification code was sent to your phone.', 'success');
        return;
      }

      await forgotPasswordMutation.mutateAsync({ email: email });
      showToast('OTP has been resent successfully to your email.', 'success');

      setTimer(30);
      setIsTimerActive(true);
    } catch (err: any) {
      const msg = err.message || 'Failed to resend OTP. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground className="flex-1 ">
      <View className="flex-1 items-center" style={[{ paddingHorizontal: horizontalPadding }]}>
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
          {isSignupScreen ? 'Enter the code sent via SMS to' : 'Verification code has been sent to'}
        </Text>

        {sendingInitialSms && isSignupScreen ? (
          <View className="flex-row items-center gap-2 mt-3">
            <ActivityIndicator color={isDark ? '#2CCB91' : '#2CCB91'} />
            <Text className={`text-[13px] ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}>
              Sending verification code…
            </Text>
          </View>
        ) : (
          <Text
            className={`text-[14px] font-semibold ${isDark ? 'text-[#2CCB91]' : 'text-textPrimary'} mt-1`}
          >
            {isSignupScreen ? maskE164(phoneE164 || '') : email}
          </Text>
        )}
        {isSignupScreen ? (
          <Text className={`text-[12px] mt-2 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}>
            You may see a quick security check (reCAPTCHA) before SMS verification.
          </Text>
        ) : null}

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

          {isTimerActive || sendingInitialSms ? (
            <Text className="text-[#2CCB91] font-semibold text-[13px]">
              {sendingInitialSms ? 'Sending…' : `Resend in ${timer}s`}
            </Text>
          ) : (
            <Pressable onPress={handleResend} disabled={loading}>
              <Text className="text-[#2CCB91] font-semibold text-[13px]">Resend</Text>
            </Pressable>
          )}
        </View>

        {/* Verify */}
        <View className="w-full">
          <Button
            text="Verify"
            onPress={handleVerify}
            disabled={!isOtpComplete || (isSignupScreen && !verificationId) || sendingInitialSms}
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

      {/* Admin Verification Modal for Consultants */}
      <InfoModal
        visible={showAdminVerificationModal}
        title="Account Under Verification"
        message="Your account is currently under admin verification. This process typically takes up to one day. You will be able to log in once your account has been verified by our admin team. We'll notify you once the verification is complete."
        buttonText="OK"
        variant="info"
        onConfirm={() => {
          setShowAdminVerificationModal(false);
          // Navigate back to login screen
          navigation.navigate('Login');
        }}
        onClose={() => {
          setShowAdminVerificationModal(false);
          // Navigate back to login screen
          navigation.navigate('Login');
        }}
      />
    </GradientBackground>
  );
}
