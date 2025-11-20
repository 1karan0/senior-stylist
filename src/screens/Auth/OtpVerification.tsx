import React, { use, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useResendVerificationCodeApi } from '@/api/auth/useResendCode';

export default function OtpVerificationScreen({ navigation, route }: any) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [serverError, setServerError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(true);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { verifyEmail } = useAuth();

  const isOtpComplete = otp.every((digit) => digit !== '');
  const resendMutation = useResendVerificationCodeApi();

  const email = route.params.email;

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
    const interval = setInterval(() => {
      setResendMessage('');
      setServerError('');
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
    const res = await verifyEmail(email, code);

    if (!res.success) {
      setServerError(res.error || 'Invalid code');
      setLoading(false);
      return;
    }
    setLoading(false);
    setServerError('');
    navigation.navigate('NextScreen');
  };
  const handleResend = async () => {
    if (isTimerActive) return; // prevent spam tap

    try {
      const res = await resendMutation.mutateAsync({ email: 'test4@gmail.com' });

      setResendMessage('OTP has been resent successfully.');
      setServerError('');

      // restart timer
      setTimer(30);
      setIsTimerActive(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong.';
      setServerError(msg);
    }
  };

  return (
    <LinearGradient
      colors={['#ECFAF5', '#D1F6E7']} // pick your exact light-green gradient shades
      start={{ x: 0, y: 0 }}
      end={{ x: 2, y: 4 }}
      className="flex-1 px-6 items-center"
    >
      {/* Logo */}
      <Image
        source={require('../../assets/colored_logo.png')}
        className="w-[100px] h-[100px] mt-14 mb-6"
        resizeMode="contain"
      />

      <Text className="text-[22px] font-bold text-[#162721]">Enter OTP Verification Code</Text>

      <Text className="text-[13px] text-[#658176] mt-2">Verification code has been sent to</Text>

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
            className="w-12 h-12 border border-[#27B07D] rounded-md mx-1 text-center text-[20px] text-black bg-white"
          />
        ))}
      </View>

      {/* Resend */}
      <View className="flex-row mb-6">
        <Text className="text-[#6B6B6B] text-[13px]">Didn’t receive the code? </Text>

        {isTimerActive ? (
          <Text className="text-[#2CCB91] font-semibold text-[13px]">Resend in {timer}s</Text>
        ) : (
          <Pressable onPress={handleResend}>
            <Text className="text-[#2CCB91] font-semibold text-[13px]">Resend</Text>
          </Pressable>
        )}
      </View>

      {/* Server Error */}
      {resendMessage ? (
        <View>
          <Text className="text-green-500 text-[13px] mb-4">{resendMessage}</Text>
        </View>
      ) : null}

      {serverError ? (
        <View>
          <Text className="text-red-500 text-[13px] mb-4">{serverError}</Text>
        </View>
      ) : null}

      {/* Verify */}
      <Pressable
        disabled={!isOtpComplete}
        onPress={handleVerify}
        className="w-full rounded-xl overflow-hidden mb-4"
      >
        {isOtpComplete ? (
          <LinearGradient
            colors={['#2CCB91', '#23A76F']}
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
          <View className="h-[50px] rounded-xl justify-center items-center bg-[#DADADA]">
            <Text className="text-white font-bold text-[16px]">Verify</Text>
          </View>
        )}
      </Pressable>

      {/* Go Back */}
      <Pressable
        onPress={() => navigation.goBack()}
        className="w-full h-[50px] rounded-xl border border-[#DAE7E0] justify-center items-center"
      >
        <Text className="text-[15px] text-[#162721] font-bold">Go Back</Text>
      </Pressable>
    </LinearGradient>
  );
}
