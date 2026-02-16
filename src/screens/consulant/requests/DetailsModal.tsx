import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

import { ModalWrapper } from '@/common/components/ModalWrapper';
import ImageModal from '@/common/components/modals/ImageModal';
import { RequestItem } from './List';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/contexts/ThemeContext';

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
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const { isDark } = useTheme();
  useEffect(() => {
    if (request?.imageUrl) {
      setIsImageLoading(true);
    }
  }, [request?.imageUrl]);

  if (!request) {
    return null;
  }

  const requestedAtText = formatTimestamp(request.requestedAt);

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      containerClassName={`w-[95%] mx-4 p-2 ${isDark ? 'bg-[#0D1A16]' : 'bg-white'} rounded-2xl`}
    >
      <TouchableOpacity className="absolute top-4 right-4 z-10" onPress={onClose}>
        <Text>
          <Ionicons name="close" size={24} color={isDark ? 'white' : 'textDark'} />
        </Text>
      </TouchableOpacity>

      <ScrollView className="pt-5" contentContainerStyle={{ paddingBottom: 24 }}>
        <View
          className="w-14 h-14 rounded-full items-center justify-center overflow-hidden mb-4"
          style={{ backgroundColor: '#27B07D' }}
        >
          <Image
            source={require('@/assets/icons/note.png')}
            className="w-6 h-6"
            resizeMode="contain"
          />
        </View>

        <Text
          className={`text-2xl font-urbanist font-bold ${isDark ? 'text-white' : 'text-textDark'}`}
        >
          {request.customerName}
        </Text>
        {requestedAtText ? (
          <Text
            className={`text-sm font-poppins ${isDark ? 'text-textSecondary' : 'text-textMuted'} mt-1`}
          >
            {requestedAtText}
          </Text>
        ) : null}

        {request.hasImage && (
          <View className="bg-[#DAE7E0] px-3 py-1 rounded-full self-start flex-row items-center mt-4">
            <Image
              source={require('@/assets/icons/photo.png')}
              className="w-4 h-4 mr-2"
              resizeMode="contain"
            />
            <Text className="font-urbanist font-semibold text-textDark text-xs">
              Photo attached
            </Text>
          </View>
        )}
        {request.imageUrl && (
          <View className="mt-4">
            <TouchableOpacity onPress={() => setImageModalVisible(true)} activeOpacity={0.9}>
              <Image
                source={{ uri: request.imageUrl }}
                className={`w-full h-64 rounded-xl border ${isDark ? 'border-[#1A2E28]' : 'border-[#DAE7E0]'}`}
                resizeMode="cover"
                onLoadStart={() => setIsImageLoading(true)}
                onLoadEnd={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            </TouchableOpacity>
            {isImageLoading && (
              <View className="absolute inset-0 items-center justify-center rounded-xl bg-black/10">
                <ActivityIndicator size="small" color="#0E9F6E" />
              </View>
            )}
          </View>
        )}
        <View className="mt-6">
          <Text
            className={`text-lg font-poppins font-bold ${isDark ? 'text-white' : 'text-textDark'} mb-2`}
          >
            Requirements
          </Text>
          <Text
            className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} font-poppins leading-6`}
          >
            {request.problemDescription || 'No specific requirements provided.'}
          </Text>
        </View>
      </ScrollView>

      <ImageModal
        visible={imageModalVisible}
        imageUri={request.imageUrl ?? null}
        onClose={() => setImageModalVisible(false)}
      />
    </ModalWrapper>
  );
};

export default DetailsModal;
