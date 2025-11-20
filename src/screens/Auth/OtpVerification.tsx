import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function OtpVerificationScreen({ navigation }: any) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const isOtpComplete = otp.every((digit) => digit !== '');

  const handleChange = (value: string, index: number) => {
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
        <Pressable onPress={() => console.log('Resend pressed')}>
          <Text className="text-[#2CCB91] font-semibold text-[13px]">Resend</Text>
        </Pressable>
      </View>

      {/* Verify */}
      <Pressable disabled={!isOtpComplete} className="w-full rounded-xl overflow-hidden mb-4">
        {isOtpComplete ? (
          <LinearGradient
            colors={['#2CCB91', '#23A76F']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            className="h-[50px] rounded-xl justify-center items-center"
          >
            <Text className="text-white font-bold text-[16px]">Verify</Text>
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
