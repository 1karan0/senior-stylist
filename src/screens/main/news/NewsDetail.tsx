import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

const NewsDetailScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header with Back Button */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={handleBack} className="p-2 mr-3">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">News Details</Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-2xl font-bold text-gray-800 mb-5">news Details</Text>
        <Text className="text-lg text-gray-600 text-center">
          Detailed news information goes here
        </Text>
      </View>
    </View>
  );
};

export default NewsDetailScreen;
