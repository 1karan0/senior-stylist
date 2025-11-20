import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Switch, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const Profile: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Header with Theme Toggle */}
      <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-xl font-bold text-gray-800 dark:text-white">Profile</Text>
        <View className="flex-row items-center">
          <Text className="text-gray-600 dark:text-gray-400 mr-2 text-sm">
            {isDark ? '🌙' : '☀️'}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#d1d5db', true: '#10b981' }}
            thumbColor={isDark ? '#ffffff' : '#ffffff'}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-8 text-center">
          Consultant Profile
        </Text>

        {/* Theme Debug Info */}
        <View className="bg-yellow-100 dark:bg-yellow-900 rounded-2xl p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-800 dark:text-yellow-200 mb-2">
            🔧 Theme Debug Info
          </Text>
          <Text className="text-gray-700 dark:text-yellow-300 text-sm">
            • Current Theme: {theme}
          </Text>
          <Text className="text-gray-700 dark:text-yellow-300 text-sm">
            • isDark: {isDark.toString()}
          </Text>
          <Text className="text-gray-700 dark:text-yellow-300 text-sm">
            • Switch matches:{' '}
            {isDark === (theme === 'dark' || (theme === 'system' && isDark)) ? '✅' : '❌'}
          </Text>
        </View>

        {/* Theme Settings Section */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Appearance Settings
          </Text>

          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {isDark ? 'Dark theme is enabled' : 'Light theme is enabled'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#f1f5f9', true: '#10b981' }}
              thumbColor={isDark ? '#ffffff' : '#ffffff'}
            />
          </View>

          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-3">
            Current mode:{' '}
            {theme === 'system' ? 'System Default' : theme === 'dark' ? 'Dark' : 'Light'}
          </Text>

          {/* Quick Theme Buttons */}
          <View className="flex-row justify-between gap-2 mt-4">
            <TouchableOpacity
              className={`flex-1 px-3 py-2 rounded-lg ${
                theme === 'light' ? 'bg-blue-600' : 'bg-blue-500'
              }`}
              onPress={() => setTheme('light')}
            >
              <Text className="text-white text-center text-sm font-medium">Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 px-3 py-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-700'
              }`}
              onPress={() => setTheme('dark')}
            >
              <Text className="text-white text-center text-sm font-medium">Dark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 px-3 py-2 rounded-lg ${
                theme === 'system' ? 'bg-green-600' : 'bg-green-500'
              }`}
              onPress={() => setTheme('system')}
            >
              <Text className="text-white text-center text-sm font-medium">System</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Visual Test Elements */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Visual Test
          </Text>

          <View className="space-y-3">
            <Text className="text-gray-800 dark:text-white">
              This text should be black in light mode and white in dark mode
            </Text>
            <View className="h-4 bg-gray-200 dark:bg-gray-600 rounded" />
            <View className="h-4 bg-gray-300 dark:bg-gray-500 rounded" />
            <View className="h-4 bg-gray-400 dark:bg-gray-400 rounded" />

            {/* Color test blocks */}
            <View className="flex-row gap-2 mt-4">
              <View className="flex-1 h-8 bg-blue-500 dark:bg-blue-600 rounded" />
              <View className="flex-1 h-8 bg-green-500 dark:bg-green-600 rounded" />
              <View className="flex-1 h-8 bg-red-500 dark:bg-red-600 rounded" />
            </View>
          </View>
        </View>

        {/* Theme State Indicator */}
        <View
          className={`rounded-2xl p-4 mb-6 ${
            isDark ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'
          }`}
        >
          <Text
            className={`text-center font-bold text-lg ${
              isDark ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'
            }`}
          >
            {isDark ? '🌙 DARK MODE ACTIVE' : '☀️ LIGHT MODE ACTIVE'}
          </Text>
        </View>

        <TouchableOpacity
          className="bg-blue-500 dark:bg-blue-600 px-6 py-4 rounded-lg w-full mb-6"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white text-center text-lg font-semibold">Open Profile Modal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-4 w-80">
            <Text className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              Profile Settings
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Manage your consultant profile, availability, and services.
            </Text>
            <TouchableOpacity
              className="bg-blue-500 dark:bg-blue-600 px-4 py-3 rounded-lg"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white text-center font-semibold">Close Modal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;
