import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';

interface ChatLoadingScreenProps {
  onBack: () => void;
}

const ChatLoadingScreen: React.FC<ChatLoadingScreenProps> = ({ onBack }) => {
  return (
    <LinearGradient colors={['#0E1B16', '#152821']} className="flex-1">
      <View className="bg-buttonPrimaryBg pt-[50px] pb-4 px-4 flex-row items-center">
        <TouchableOpacity onPress={onBack} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center justify-center">
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text className="text-white text-sm font-medium ml-2">Loading chat…</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

export default ChatLoadingScreen;
