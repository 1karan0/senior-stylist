import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { ModalWrapper } from '@/common/components/ModalWrapper';
import { Button } from '@/common/components/Button';
import { useTheme } from '@/contexts/ThemeContext';

type InfoModalVariant = 'success' | 'error' | 'info' | 'warning';

interface InfoModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onConfirm: () => void;
  onClose?: () => void;
  variant?: InfoModalVariant;
}

const variantConfig: Record<
  InfoModalVariant,
  { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bgClass: string }
> = {
  success: { icon: 'checkmark-circle', color: '#16A34A', bgClass: 'bg-green-500/10' },
  error: { icon: 'close-circle', color: '#DC2626', bgClass: 'bg-red-500/10' },
  info: { icon: 'information-circle', color: '#3B82F6', bgClass: 'bg-blue-500/10' },
  warning: { icon: 'alert-circle', color: '#F59E0B', bgClass: 'bg-orange-500/10' },
};

const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  title,
  message,
  buttonText = 'OK',
  onConfirm,
  onClose,
  variant = 'info',
}) => {
  const { isDark } = useTheme();
  const cfg = variantConfig[variant];

  return (
    <ModalWrapper visible={visible} onClose={onClose ?? onConfirm} dismissOnBackdropPress={true}>
      <View className="items-center">
        <Text className={`text-xl font-poppins-semibold mb-3 text-center `}>{title}</Text>

        <Text
          className={`font-poppins-regular mb-6 text-center text-[#658176] ${
            isDark ? 'text-textSecondary' : 'text-[#658176]'
          }`}
        >
          {message}
        </Text>

        <View className="w-full items-center">
          <Button
            text={buttonText}
            variant="gradient"
            onPress={onConfirm}
            className="rounded-[14px] w-full"
          />
        </View>
      </View>
    </ModalWrapper>
  );
};

export default InfoModal;
