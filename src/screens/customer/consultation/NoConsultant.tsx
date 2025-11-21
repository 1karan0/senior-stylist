import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';

type RootStackParamList = {
  NewConsultant: undefined;
  // add other routes here if needed
};

const NoConsultant = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  return (
    <View className={`flex-1  bg-white`}>
      {/* Soft gradient background */}
      <GradientBackground className="flex-1 px-5 pt-16">
        {/* Header */}
        <Text className={`text-[26px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'} `}>
          Chats
        </Text>
        <Text className={` ${isDark ? 'text-[#8AA897]' : 'text-gray-500'} mt-1`}>
          Manage your styling sessions
        </Text>

        {/* Card */}
        <View
          className={` ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-gray-100'} rounded-2xl shadow-md mt-10 p-6 items-center border `}
        >
          {/* Chat Icon */}
          <View className="w-14 h-14 rounded-full border border-green-500 flex items-center justify-center mb-4">
            <Image
              source={require('@/assets/icons/chat-empty.png')}
              className="w-7 h-7"
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text
            className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}  mb-1`}
          >
            No Chats
          </Text>

          {/* Subtitle */}
          <Text className={` ${isDark ? 'text-[#8AA897]' : 'text-gray-500'} text-center px-4 mb-6`}>
            You don’t have any conversations yet. Tap the button below to find an expert to get
            started!
          </Text>

          {/* Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('NewConsultant')}
            className="bg-green-500 flex-row items-center justify-center rounded-xl py-3 px-6 w-full"
          >
            <Image
              source={require('@/assets/icons/white-search-icon.png')}
              className="w-5 h-5 mr-2"
            />
            <Text className="text-white font-semibold text-base">Find an expert</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    </View>
  );
};

export default NoConsultant;
