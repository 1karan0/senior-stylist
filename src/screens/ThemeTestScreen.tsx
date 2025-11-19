import React from 'react';
import { View, Text, ScrollView, StatusBar, Switch } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { GradientButton } from '@/common/components/GradientButton';

export const ThemeTestScreen: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#000000' : '#FFFFFF'}
      />

      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-black dark:text-white">Theme Test Screen</Text>
          <Text className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Test if dark/light mode is working properly
          </Text>
        </View>

        {/* Current Theme Info */}
        <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <Text className="text-lg font-semibold text-black dark:text-white">
            Current Theme Information
          </Text>
          <Text className="text-black dark:text-white mt-2">
            • System Theme: {isDark ? 'Dark' : 'Light'}
          </Text>
          <Text className="text-black dark:text-white">• Selected Mode: {theme}</Text>
          <Text className="text-black dark:text-white">
            • Effective Theme: {isDark ? 'Dark' : 'Light'}
          </Text>
        </View>

        {/* Theme Controls */}
        <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <Text className="text-lg font-semibold text-black dark:text-white mb-4">
            Theme Controls
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-black dark:text-white">System Default</Text>
            <Switch
              value={theme === 'system'}
              onValueChange={(value) => setTheme(value ? 'system' : isDark ? 'dark' : 'light')}
            />
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-black dark:text-white">Light Mode</Text>
            <Switch
              value={theme === 'light'}
              onValueChange={(value) => setTheme(value ? 'light' : 'system')}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-black dark:text-white">Dark Mode</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={(value) => setTheme(value ? 'dark' : 'system')}
            />
          </View>
        </View>

        {/* Visual Test Elements */}
        <View className="space-y-4">
          {/* Background Test */}
          <View className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <Text className="text-black dark:text-white font-semibold">Background Test</Text>
            <Text className="text-gray-600 dark:text-gray-300">
              This card should have different backgrounds in light/dark mode
            </Text>
          </View>

          {/* Text Color Test */}
          <View className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Text className="text-black dark:text-white font-semibold">Primary Text</Text>
            <Text className="text-gray-600 dark:text-gray-300">
              Secondary text that should be visible in both themes
            </Text>
          </View>

          {/* Gradient Button Test */}
          <GradientButton
            title="Test Gradient Button"
            onPress={() => console.log('Button pressed!')}
            variant="primary"
          />

          {/* Color Samples */}
          <View className="flex-row justify-between">
            <View className="w-16 h-16 bg-primary-500 rounded-lg" />
            <View className="w-16 h-16 bg-success-500 rounded-lg" />
            <View className="w-16 h-16 bg-warning-500 rounded-lg" />
            <View className="w-16 h-16 bg-error-500 rounded-lg" />
          </View>
          <Text className="text-center text-black dark:text-white">
            Color samples should remain consistent
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};
