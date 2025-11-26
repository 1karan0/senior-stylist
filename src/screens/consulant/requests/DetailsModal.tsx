import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { ModalWrapper } from '@/common/components/ModalWrapper';
import { RequestItem } from './List';

export interface DetailsModalProps {
  visible: boolean;
  onClose: () => void;
  request: RequestItem | null;
}

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} • ${date.toLocaleTimeString()}`;
};

const DetailsModal: React.FC<DetailsModalProps> = ({ visible, onClose, request }) => {
  if (!request) {
    return null;
  }

  const requestedAtText = formatTimestamp(request.requestedAt);

  return (
    <ModalWrapper visible={visible} onClose={onClose} containerClassName="w-[95%] mx-4 p-2">
      <TouchableOpacity className="absolute top-4 right-4 z-10" onPress={onClose}>
        <Image
          source={require('@/assets/icons/close.png')}
          className="w-5 h-5"
          resizeMode="contain"
        />
      </TouchableOpacity>

      <ScrollView className="pt-5" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="w-14 h-14 rounded-full items-center justify-center overflow-hidden mb-4">
          <LinearGradient
            colors={['#27B07D', '#36D399']}
            className="w-full h-full items-center justify-center"
          >
            <Image
              source={require('@/assets/icons/note.png')}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </LinearGradient>
        </View>

        <Text className="text-2xl font-urbanist font-bold text-[#162721]">
          {request.customerName}
        </Text>
        {requestedAtText ? (
          <Text className="text-sm font-poppins text-[#658176] mt-1">{requestedAtText}</Text>
        ) : null}

        {request.hasImage && (
          <View className="bg-[#DAE7E0] px-3 py-1 rounded-full self-start flex-row items-center mt-4">
            <Image
              source={require('@/assets/icons/photo.png')}
              className="w-4 h-4 mr-2"
              resizeMode="contain"
            />
            <Text className="font-urbanist font-semibold text-[#162721] text-xs">
              Photo attached
            </Text>
          </View>
        )}

        <View className="mt-6">
          <Text className="text-lg font-poppins font-bold text-[#162721] mb-2">Requirements</Text>
          <Text className="text-[#658176] font-poppins leading-6">
            {request.problemDescription || 'No specific requirements provided.'}
          </Text>
        </View>
      </ScrollView>
    </ModalWrapper>
  );
};

export default DetailsModal;
