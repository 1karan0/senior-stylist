import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { ModalWrapper } from '@/common/components/ModalWrapper';
import Button from '@/common/components/Button';
import { useTheme } from '@/contexts/ThemeContext';

interface DownloadSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  filename?: string;
  directoryName?: string;
}

const DownloadSuccessModal: React.FC<DownloadSuccessModalProps> = ({
  visible,
  onClose,
  filename,
  directoryName,
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
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-[#27B07D]/10">
          <Ionicons name="checkmark-circle" size={48} color="#27B07D" />
        </View>
        <Text
          className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-black'} mb-3`}
        >
          Download Complete
        </Text>
        <Text
          className={`text-base font-urbanist-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-center mb-2`}
        >
          File saved successfully to{' '}
          <Text className="font-urbanist-semibold">{directoryName || 'device storage'}</Text>{' '}
          folder.
        </Text>
        <View
          className={`w-full rounded-xl p-3 mb-6 ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-[#F7FAF8] border-[#DAE7E0]'}`}
        >
          <Text
            className={`text-xs font-urbanist-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} mb-1`}
          >
            Filename:
          </Text>
          <Text
            className={`text-sm font-urbanist-semibold ${isDark ? 'text-white' : 'text-black'}`}
            numberOfLines={2}
          >
            {filename || 'statement.csv'}
          </Text>
        </View>
        <Button text="OK" variant="gradient" onPress={onClose} className="w-full rounded-[10px]" />
      </View>
    </ModalWrapper>
  );
};

export default DownloadSuccessModal;
