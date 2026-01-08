import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { ModalWrapper } from '@/common/components/ModalWrapper';
import Button from '@/common/components/Button';

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
  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      dismissOnBackdropPress={true}
      containerClassName="bg-white"
    >
      <View className="items-center">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-[#27B07D]/10">
          <Ionicons name="checkmark-circle" size={48} color="#27B07D" />
        </View>
        <Text className="text-2xl font-urbanist-bold mb-3 text-black">Download Complete</Text>
        <Text className="text-base font-urbanist-regular text-center mb-2 text-[#658176]">
          File saved successfully to{' '}
          <Text className="font-urbanist-semibold">{directoryName || 'device storage'}</Text>{' '}
          folder.
        </Text>
        <View className="w-full rounded-xl p-3 mb-6 bg-[#F7FAF8] border border-[#DAE7E0]">
          <Text className="text-xs font-urbanist-regular mb-1 text-[#658176]">Filename:</Text>
          <Text className="text-sm font-urbanist-semibold text-black" numberOfLines={2}>
            {filename || 'statement.csv'}
          </Text>
        </View>
        <Button text="OK" variant="gradient" onPress={onClose} className="w-full rounded-[10px]" />
      </View>
    </ModalWrapper>
  );
};

export default DownloadSuccessModal;
