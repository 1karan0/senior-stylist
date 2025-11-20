import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '@/common/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

interface Props {
  navigation: ProfileNavigationProp;
}

const Profile: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-xl font-bold text-gray-800 dark:text-white">Profile Home</Text>
      </View>

      {/* Content */}
      <View className="flex-1 p-6">
        <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-8 text-center">
          Profile Home
        </Text>

        {/* Theme Toggle Section */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Theme Settings
          </Text>

          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-gray-700 dark:text-gray-300 font-medium">
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

        {/* Navigation Buttons */}
        <TouchableOpacity
          className="bg-blue-500 dark:bg-blue-600 px-6 py-4 rounded-lg mb-4 w-full"
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text className="text-white text-center text-lg font-semibold">Go to Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-green-500 dark:bg-green-600 px-6 py-4 rounded-lg mb-4 w-full"
          onPress={() => navigation.navigate('Settings')}
        >
          <Text className="text-white text-center text-lg font-semibold">Go to Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500 dark:bg-red-600 px-6 py-4 rounded-lg w-full"
          onPress={() => logout()}
        >
          <Text className="text-white text-center text-lg font-semibold">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Profile;
