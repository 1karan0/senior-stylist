import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import type { FlashListRef } from '@shopify/flash-list';
import type { ChatMessage } from '@/types/chat';

interface ScrollToBottomButtonProps {
  visible: boolean;
  onPress: () => void;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ visible, onPress }) => {
  if (!visible) {
    return null;
  }

  return (
    <TouchableOpacity
      className="absolute bottom-[100px] right-4"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-11 h-11 rounded-full bg-black/50 justify-center items-center">
        <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
};

export default ScrollToBottomButton;
