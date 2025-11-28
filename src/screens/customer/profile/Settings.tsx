import React from 'react';
import { View, Text, TouchableOpacity, Switch, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';

const Settings: React.FC = () => {
  const navigation = useNavigation();
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <GradientBackground>
      <View className="flex-1 px-5 pt-6 ">
        {/* Header with Back Button */}
        <View className="flex-row items-center p-4 ">
          <TouchableOpacity onPress={handleBack} className="p-2 mr-3">
            <Image
              source={
                isDark
                  ? require('@/assets/icons/green-back.png')
                  : require('@/assets/icons/back.png')
              }
            />
          </TouchableOpacity>
          <Text className={` ${isDark ? 'text-white' : 'text-gray-800'} text-xl font-bold `}>
            Settings
          </Text>
        </View>

        <View
          className={`${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-2xl border p-6 mb-6 shadow-sm`}
        >
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'} mb-4`}>
            Theme Settings
          </Text>

          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className={`${isDark ? 'text-white' : 'text-black'} font-medium`}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {isDark ? 'Dark theme is enabled' : 'Light theme is enabled'}
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Current:{' '}
                {theme === 'system' ? 'System Default' : theme === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
              thumbColor={isDark ? '#ffffff' : '#ffffff'}
              ios_backgroundColor="#d1d5db"
            />
          </View>

          {/* Quick Theme Buttons */}
          <View className="flex-row gap-2 mt-4">
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
      </View>
    </GradientBackground>
  );
};

export default Settings;
