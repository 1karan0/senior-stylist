import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import Button from '@/common/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import {
  initializeFirebase,
  sendPhoneVerificationCode,
  verifyPhoneOtpCode,
} from '@/services/firebase';
import CompleteQuestions from '@/common/components/CompleteQuestions';
import PhoneNumberInput from '@/common/components/PhoneNumberInput';

interface PhoneVerificationPromptProps {
  phoneE164: string;
  phoneDisplay: string;
  isSubmitting: boolean;
  onVerifyToken: (firebaseIdToken: string) => Promise<void>;
  showBanner?: boolean;
  autoOpenIntro?: boolean;
}

const PhoneVerificationPrompt: React.FC<PhoneVerificationPromptProps> = ({
  phoneE164,
  phoneDisplay,
  isSubmitting,
  onVerifyToken,
  showBanner = true,
  autoOpenIntro = false,
}) => {
  const { isDark } = useTheme();
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sendingCode, setSendingCode] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [error, setError] = useState('');
  const initialCodeFromDisplay = phoneDisplay?.trim().startsWith('+')
    ? phoneDisplay.trim().split(/\s+/)[0]
    : '';
  const initialNumberFromDisplay = phoneDisplay?.trim().startsWith('+')
    ? phoneDisplay.trim().split(/\s+/).slice(1).join('').replace(/\D/g, '')
    : '';
  const [selectedCallingCode, setSelectedCallingCode] = useState<any>({
    cca2: 'GB',
    callingCode: initialCodeFromDisplay || '+44',
  });
  const [phoneInput, setPhoneInput] = useState(
    initialNumberFromDisplay || (phoneE164 || '').replace(/\D/g, '')
  );
  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (!isTimerActive) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerActive]);

  useEffect(() => {
    if (autoOpenIntro) {
      setShowIntroModal(true);
    }
  }, [autoOpenIntro]);

  const buildE164 = () => {
    const callingCode = selectedCallingCode?.callingCode ?? '';
    const normalizedCode = callingCode.startsWith('+')
      ? callingCode.trim()
      : `+${callingCode.trim()}`;
    const normalizedPhone = phoneInput.replace(/\D/g, '');
    return `${normalizedCode}${normalizedPhone}`;
  };

  const sendCode = async (targetPhoneE164: string) => {
    if (!targetPhoneE164 || !targetPhoneE164.startsWith('+')) {
      setError('Phone number is missing. Please update your profile first.');
      return;
    }

    try {
      setSendingCode(true);
      setError('');
      initializeFirebase();
      const id = await sendPhoneVerificationCode(targetPhoneE164);
      setVerificationId(id);
      setOtp(['', '', '', '', '', '']);
      setShowConfirmModal(false);
      setShowModal(true);
      setTimer(30);
      setIsTimerActive(true);
    } catch (err: any) {
      console.log('err======', err);
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const next = value.replace(/[^0-9]/g, '').slice(0, 1);
    const updated = [...otp];
    updated[index] = next;
    setOtp(updated);
    if (next && index < updated.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (!verificationId || code.length !== 6) return;

    try {
      setError('');
      const firebaseUser = await verifyPhoneOtpCode(verificationId, code);
      const firebaseIdToken = await firebaseUser.getIdToken(true);
      await onVerifyToken(firebaseIdToken);
      setShowModal(false);
    } catch (err: any) {
      console.log('err======', err);
      setError(err?.message || 'Invalid code. Please try again.');
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');
  const canSendCode =
    String(selectedCallingCode?.callingCode ?? '').trim().length > 1 &&
    phoneInput.replace(/\D/g, '').length >= 7;

  return (
    <View className="mb-4">
      {showBanner ? (
        <CompleteQuestions
          title="Verify your phone number"
          subtitle={`Secure your account with ${phoneDisplay || phoneE164}`}
          iconName="phone-portrait-outline"
          accessibilityLabel="Verify your phone number"
          onPress={() => {
            setError('');
            // From in-screen banner, jump straight to number confirmation.
            // Intro modal is reserved for post-login auto prompt only.
            setShowConfirmModal(true);
          }}
          loading={sendingCode || isSubmitting}
          disabled={sendingCode || isSubmitting}
        />
      ) : null}

      <Modal
        visible={showIntroModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIntroModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-5">
          <View
            className={`rounded-2xl p-5 border ${
              isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
            }`}
          >
            <View className="items-center">
              <Ionicons name="warning-outline" size={36} color="#27B07D" />
              <Text
                className={`text-[22px] mt-2 font-urbanist-bold text-center ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                Number not verified
              </Text>
              <Text
                className={`text-[14px] mt-2 text-center ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
              >
                Your phone number is not verified. Please verify to continue securely.
              </Text>
            </View>

            <View className="mt-5">
              <Button
                text="Verify Now"
                variant="gradient"
                onPress={() => {
                  setShowIntroModal(false);
                  setShowConfirmModal(true);
                }}
              />
            </View>
            <View className="mt-3">
              <Button
                text="Later"
                onPress={() => setShowIntroModal(false)}
                variant="light"
                className={`rounded-[10px] ${
                  isDark ? 'bg-[#0E1B17] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DAE7E0]'
                } border`}
                textClassName={`${isDark ? 'text-[#ffffff]' : 'text-[#162721]'} text-base font-urbanist-bold`}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-5">
          <View
            className={`rounded-2xl p-5 border ${
              isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
            }`}
          >
            <View className="items-end">
              <Text onPress={() => setShowConfirmModal(false)}>
                <Ionicons name="close-outline" size={24} color="#27B07D" />
              </Text>
            </View>
            <Text
              className={`text-[22px] font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Confirm your number
            </Text>
            <Text
              className={`text-[13px] mt-2 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              Check or edit your phone number before we send OTP.
            </Text>

            <Text
              className={`text-[13px] mb-1 mt-1 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              Phone number
            </Text>
            <PhoneNumberInput
              value={phoneInput}
              error={error as string}
              initialCountry={selectedCallingCode}
              onPhoneChange={(country, phone) => {
                setSelectedCallingCode(country);
                setPhoneInput(phone);
              }}
            />

            <Text
              className={`mt-2 text-[12px] ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              OTP will be sent to {buildE164()}.
            </Text>

            <View className="mt-4">
              <Button
                text="Send Verification Code"
                onPress={() => sendCode(buildE164())}
                disabled={!canSendCode || sendingCode}
                loading={sendingCode}
                variant="gradient"
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-5">
          <View
            className={`rounded-2xl p-5 border ${
              isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
            }`}
          >
            <View className="items-end">
              <Text onPress={() => setShowModal(false)}>
                <Ionicons name="close-outline" size={24} color="#27B07D" />
              </Text>
            </View>
            <Text
              className={`text-[22px] font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Enter OTP Code
            </Text>
            <Text
              className={`text-[13px] mt-2 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              We sent a code to
            </Text>
            <Text
              className={`text-[14px] font-semibold mt-1 ${isDark ? 'text-[#2CCB91]' : 'text-textPrimary'}`}
            >
              {buildE164()}
            </Text>

            <View className="flex-row justify-center gap-2 mt-6 mb-4">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
                      otpRefs.current[index - 1]?.focus();
                      const updated = [...otp];
                      updated[index - 1] = '';
                      setOtp(updated);
                    }
                  }}
                  maxLength={1}
                  keyboardType="number-pad"
                  className={`w-11 h-12 border border-textPrimary rounded-md mx-1 text-center text-[18px] ${
                    isDark ? 'bg-commonGradientStop6 text-white' : 'bg-white text-black'
                  }`}
                />
              ))}
            </View>

            <View className="flex-row mb-5 justify-center">
              <Text className={`text-[13px] ${isDark ? 'text-textSecondary' : 'text-[#6B6B6B]'}`}>
                Didn&apos;t receive the code?{' '}
              </Text>
              {isTimerActive ? (
                <Text className="text-[#2CCB91] font-semibold text-[13px]">{`Resend in ${timer}s`}</Text>
              ) : (
                <Pressable onPress={() => sendCode(buildE164())} disabled={sendingCode}>
                  {sendingCode ? (
                    <ActivityIndicator size="small" color="#2CCB91" />
                  ) : (
                    <Text className="text-[#2CCB91] font-semibold text-[13px]">Resend</Text>
                  )}
                </Pressable>
              )}
            </View>

            {!!error && <Text className="mb-4 text-[12px] text-error text-center">{error}</Text>}

            <Button
              text="Verify"
              onPress={handleVerify}
              disabled={!isOtpComplete || isSubmitting}
              loading={isSubmitting}
              variant="gradient"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PhoneVerificationPrompt;
