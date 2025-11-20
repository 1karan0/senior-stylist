import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '@/common/types';
import { useAuth } from '@/contexts/AuthContext';

type ProfileHomeScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

interface Props {
  navigation: ProfileHomeScreenNavigationProp;
}

const ProfileHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Profile Home</Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-2xl font-bold text-gray-800 mb-8">Profile Home</Text>

        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg mb-4 w-64"
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text className="text-white text-center text-lg font-semibold">Go to Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-green-500 px-6 py-3 rounded-lg w-64"
          onPress={() => navigation.navigate('Settings')}
        >
          <Text className="text-white text-center text-lg font-semibold">Go to Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-red-500 px-6 py-3 rounded-lg w-64" onPress={() => logout()}>
          <Text className="text-white text-center text-lg font-semibold">logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileHomeScreen;
