import GradientBackground from '@/common/components/GradientBackground';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { Image, KeyboardAvoidingView, ScrollView, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/common/components/Button';
import PhoneNumberInput from '@/common/components/PhoneNumberInput';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import Toast from '@/common/components/Toast';
import { sendPhoneVerificationCode } from '@/services/firebase';

const PhoneOtpScreen = () => {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useTabletLayout();
  const { isDark } = useTheme();
  const navigation = useNavigation<any>();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [selectedCallingCode, setSelectedCallingCode] = useState('+44');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const handleSendCode = async (form: any) => {
    const rawPhone = String(form?.phone || '').replace(/\D/g, '');
    const countryCode = selectedCallingCode.startsWith('+')
      ? selectedCallingCode
      : `+${selectedCallingCode}`;
    const fullPhoneNumber = `${countryCode}${rawPhone}`;

    if (!rawPhone) {
      console.log('rawPhone--===', rawPhone);
      showToast('Please enter a valid phone number.', 'error');
      return;
    }

    try {
      setLoading(true);
      const verificationId = await sendPhoneVerificationCode(fullPhoneNumber);
      navigation.navigate('LoginWithPhone', {
        phoneNumber: fullPhoneNumber,
        verificationId,
      });
      showToast('Verification code sent successfully.', 'success');
      console.log('verificationId--===', fullPhoneNumber, verificationId);
    } catch (error: any) {
      console.log('error--===', error);
      showToast(error?.message || 'Failed to send verification code.', 'error');
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
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 20, flexGrow: 1 }}
          style={[{ paddingHorizontal: horizontalPadding }]}
        >
          {/* Header Section */}
          <View className="items-center mt-16 mb-12">
            <Image
              source={
                isDark
                  ? require('../../assets/icons/dark-logo.png')
                  : require('../../assets/icons/colored_logo.png')
              }
              className="w-[100px] h-[100px]"
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
              We'll send a secure <Text className="text-primary font-bold">OTP</Text> code to verify
              your identity.
            </Text>
          </View>

          {/* Input Section */}
          <View className="flex flex-col gap-2 mb-8">
            <Text
              className={`text-xs uppercase tracking-widest font-bold mb-2 ml-1 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              Phone Number
            </Text>
            <Controller
              control={control}
              name="phone"
              rules={{
                required: 'Phone number is required',
                minLength: { value: 7, message: 'Too short' },
                maxLength: { value: 15, message: 'Too long' },
              }}
              render={({ field: { onChange, value } }) => (
                <PhoneNumberInput
                  value={value}
                  error={errors.phone?.message as string}
                  onPhoneChange={(country, phone) => {
                    setSelectedCallingCode(country?.callingCode || '+44');
                    onChange(phone);
                  }}
                  onFocus={() => {}}
                  onBlur={() => {}}
                />
              )}
            />
          </View>

          {/* Action Section */}
          <View className="gap-y-6">
            <Text
              className={`text-center text-[12px] ${
                isDark ? 'text-textSecondary' : 'text-textMuted'
              }`}
            >
              You may see a quick security check (reCAPTCHA) before we send your OTP.
            </Text>
            <Button
              variant="gradient"
              text="Send Verification Code"
              onPress={handleSubmit(handleSendCode)}
              loading={loading}
              disabled={loading}
            />

            <View className="flex-row items-center justify-center">
              <Text className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} text-[14px]`}>
                Use a different login method?{' '}
              </Text>
              <Pressable onPress={() => navigation.goBack()}>
                <Text className="text-textPrimary font-bold text-[14px]">Go back</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

export default PhoneOtpScreen;
