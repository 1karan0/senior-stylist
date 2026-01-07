import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ModalWrapper } from '@/common/components/ModalWrapper';
import { Button } from '@/common/components/Button';
import { useTheme } from '@/contexts/ThemeContext';

interface CancelConsultationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  message?: string;
}

const CancelConsultationModal: React.FC<CancelConsultationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  isLoading = false,
  message,
}) => {
  const { isDark } = useTheme();

  return (
    <ModalWrapper
      visible={visible}
      onClose={onCancel}
      dismissOnBackdropPress={!isLoading}
      containerClassName={isDark ? 'bg-buttonSecondaryText' : 'bg-white'}
    >
      <View className="items-center">
        {/* Warning Icon */}
        <View className="w-16 h-16 bg-orange-500/10 rounded-full items-center justify-center mb-4">
          <Ionicons name="alert-circle" size={32} color="#FF9500" />
        </View>

        {/* Title */}
        <Text
          className={`text-xl font-urbanist-bold mb-3 text-center ${
            isDark ? 'text-white' : 'text-textDark'
          }`}
        >
          Cancel Consultation?
        </Text>

        {/* Description */}
        <Text
          className={`text-center font-poppins-regular mb-6 px-2 ${
            isDark ? 'text-textSecondary' : 'text-textMuted'
          }`}
        >
          {message ||
            'You are currently finding a stylist. Please cancel the consultation request before navigating away.'}
        </Text>

        {/* Buttons */}
        <View className="w-full space-y-3">
          {/* Cancel Consultation Button */}
          <Button
            text="Cancel Consultation"
            variant="light"
            onPress={onConfirm}
            loading={isLoading}
            disabled={isLoading}
            className="mb-3 border border-red-500 rounded-[10px]"
            textClassName="text-red-500"
          />

          {/* Stay Button */}
          <Button
            text="Stay"
            variant="gradient"
            textClassName={isDark ? 'text-white' : 'text-textDark'}
            onPress={onCancel}
            disabled={isLoading}
          />
        </View>
      </View>
    </ModalWrapper>
  );
};

export default CancelConsultationModal;
