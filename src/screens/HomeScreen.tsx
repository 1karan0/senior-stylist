import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { GradientButton } from '@/common/components/GradientButton';

export const HomeScreen: React.FC = ({ navigation }: any) => {
  const { isDark, theme } = useTheme();

  return (
    <View className="flex-1 bg-white dark:bg-black p-4">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View className="flex-1 justify-center items-center">
        <Text className="text-3xl font-bold text-black dark:text-white mb-4">
          Welcome to the App
        </Text>
        <Text className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Current theme: {theme} ({isDark ? 'Dark' : 'Light'})
        </Text>
      </View>

      <View className="space-y-4">
        <GradientButton
          title="Open Theme Test"
          onPress={() => navigation.navigate('ThemeTest')}
          variant="primary"
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg"
        >
          <Text className="text-black dark:text-white text-center font-semibold text-lg">
            Open Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
