// screens/ForceUpdateScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppVersionCheck } from '@/hooks/useAppVersionCheck';

const ForceUpdateScreen = () => {
  const { openStore, message } = useAppVersionCheck();

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 justify-center items-center p-6">
      <View className="items-center max-w-md">
        {/* Icon */}
        <View className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
          {/* Replaced ArrowUpCircle with an equivalent Ionicons icon */}
          <Ionicons name="arrow-up-circle" size={64} color="#3B82F6" />
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-3">
          Update Required
        </Text>

        {/* Message */}
        <Text className="text-base text-gray-600 dark:text-gray-300 text-center mb-6 leading-6">
          {message ||
            'A new version of the app is available and is required to continue. Please update to access all features.'}
        </Text>

        {/* Update Button */}
        <TouchableOpacity
          onPress={() => openStore()}
          className="bg-blue-500 dark:bg-blue-600 px-8 py-4 rounded-lg shadow-lg active:opacity-90"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-semibold">Update Now</Text>
        </TouchableOpacity>

        {/* Platform Info */}
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-8 text-center">
          You'll be redirected to the {Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'} to
          download the update.
        </Text>

        {/* Optional: Add instructions for returning to app */}
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
          After updating, please restart the app
        </Text>
      </View>
    </View>
  );
};

export default ForceUpdateScreen;
