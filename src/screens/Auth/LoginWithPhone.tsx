import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useRef, useState } from 'react';

const LoginWithPhoneScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useTabletLayout();
  const { isDark } = useTheme();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [loading, setLoading] = useState(false);

  const isOtpComplete = otp.every((digit) => digit !== '');

  const handleChange = (value: string, index: number) => {
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleLogin = () => {
    console.log('otp======> ', otp);
  };

  const handleResend = () => {
    console.log('resend======> ');
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
            flexGrow: 1,
          }}
          style={[{ paddingHorizontal: horizontalPadding }]}
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
              Verify Your Number
            </Text>

            <Text
              className={`font-normal text-[14px] ${
                isDark ? 'text-textSecondary' : 'text-textMuted'
              }  mt-1`}
            >
              Enter the 6-digit code sent to your phone
            </Text>
          </View>
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
          <View className="flex-row mb-6 justify-center">
            <Text className={` ${isDark ? 'text-textSecondary' : 'text-[#6B6B6B]'} text-[13px]`}>
              Didn't receive the code?{' '}
            </Text>
            <Pressable onPress={handleResend}>
              <Text className="text-[#2CCB91] font-semibold text-[13px]">Resend</Text>
            </Pressable>
          </View>
          <View className="">
            <Button
              text="Login with Phone"
              onPress={handleLogin}
              disabled={!isOtpComplete}
              loading={loading}
              variant="gradient"
            />
          </View>
          <View className="flex-row items-center justify-center mt-2">
            <Text className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} text-[14px]`}>
              Use a different login method?{' '}
            </Text>
            <Pressable onPress={() => navigation.goBack()}>
              <Text className="text-textPrimary font-bold text-[14px]">Go back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

export default LoginWithPhoneScreen;
