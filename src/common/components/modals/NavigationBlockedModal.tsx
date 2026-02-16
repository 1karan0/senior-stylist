import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ModalWrapper } from '@/common/components/ModalWrapper';
import { Button } from '@/common/components/Button';
import { useTheme } from '@/contexts/ThemeContext';

interface NavigationBlockedModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

const NavigationBlockedModal: React.FC<NavigationBlockedModalProps> = ({
  visible,
  onClose,
  message,
}) => {
  const { isDark } = useTheme();

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      dismissOnBackdropPress={true}
      containerClassName={`border rounded-2xl ${isDark ? 'bg-[#0D1A16] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
    >
      <View className="items-center">
        {/* Info Icon */}
        <View className="w-16 h-16 bg-blue-500/10 rounded-full items-center justify-center mb-4">
          <Ionicons name="information-circle" size={32} color="#3B82F6" />
        </View>

        {/* Title */}
        <Text
          className={`text-xl font-urbanist-bold mb-3 text-center ${
            isDark ? 'text-white' : 'text-textDark'
          }`}
        >
          Navigation Blocked
        </Text>

        {/* Description */}
        <Text
          className={`text-center font-poppins-regular mb-6 px-2 ${
            isDark ? 'text-textSecondary' : 'text-textMuted'
          }`}
        >
          {message ||
            'You are currently finding a stylist. Please cancel the consultation request before navigating to other screens.'}
        </Text>

        {/* Button */}
        <View className="w-full">
          <Button text="OK" variant="gradient" onPress={onClose} className="rounded-[14px]" />
        </View>
      </View>
    </ModalWrapper>
  );
};

export default NavigationBlockedModal;
