import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ModalWrapper } from '@/common/components/ModalWrapper';
import { AppButton } from '@/common/components/Button';

interface DeleteAccountModalProps {
  visible: boolean;
  isDark: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  isDark,
  onConfirm,
  onCancel,
}) => {
  return (
    <ModalWrapper
      visible={visible}
      onClose={onCancel}
      dismissOnBackdropPress={false}
      containerClassName={isDark ? 'bg-buttonSecondaryText' : 'bg-white'}
    >
      <View className="items-center">
        {/* Warning Icon */}
        <View className="w-16 h-16 bg-red-500/10 rounded-full items-center justify-center mb-4">
          <Ionicons name="warning" size={32} color="#F22D2D" />
        </View>

        {/* Title */}
        <Text
          className={`text-xl font-urbanist-bold mb-3 text-center ${
            isDark ? 'text-white' : 'text-textDark'
          }`}
        >
          Delete Account?
        </Text>

        {/* Description */}
        <Text
          className={`text-center font-poppins-regular mb-6 ${
            isDark ? 'text-textSecondary' : 'text-textMuted'
          }`}
        >
          Are you sure you want to delete your account? This action cannot be undone and all your
          data will be permanently removed.
        </Text>

        {/* Buttons */}
        <View className="w-full space-y-3">
          {/* Delete Button */}
          <View className="mb-3">
            <AppButton text="Yes, Delete Account" variant="gradient" onPress={onConfirm} />
          </View>

          {/* Cancel Button */}
          <AppButton
            text="Cancel"
            variant="light"
            textClassName={'text-textDark'}
            onPress={onCancel}
          />
        </View>
      </View>
    </ModalWrapper>
  );
};

export default DeleteAccountModal;
