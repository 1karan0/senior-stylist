import React from 'react';
import { View, Text } from 'react-native';
import { ModalWrapper } from '../ModalWrapper';
import Button from '../Button';
import { useTheme } from '@/contexts/ThemeContext';

interface CancelSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { isDark } = useTheme();
  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      dismissOnBackdropPress={!isLoading}
      containerClassName={`border rounded-2xl ${isDark ? 'bg-[#0D1A16] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
    >
      <View className="items-center">
        <Text
          className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'} mb-4 text-center`}
        >
          Cancel Subscription
        </Text>
        <Text
          className={`text-base font-poppins-regular ${isDark ? 'text-textSecondary' : 'text-textMuted'} text-center mb-6`}
        >
          Are you sure you want to cancel your subscription? Your current subscription will remain
          active until the end of the current billing cycle and will stop once the billing period is
          over. It will not auto-renew.
        </Text>
        <View className="flex-row gap-3 w-full">
          <View className="flex-1">
            <Button
              text="No"
              variant="light"
              onPress={onClose}
              disabled={isLoading}
              className="bg-[#DAE7E0] rounded-[14px]"
            />
          </View>
          <View className="flex-1">
            <Button
              text="Yes"
              variant="gradient"
              onPress={onConfirm}
              loading={isLoading}
              disabled={isLoading}
              className="rounded-[10px]"
            />
          </View>
        </View>
      </View>
    </ModalWrapper>
  );
};
