import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileHomeScreen from '@/screens/main/profile/ProfileHomeScreen';
// import EditProfileScreen from '@/screens/main/profile/EditProfileScreen';
// import SettingsScreen from '@/screens/main/profile/SettingsScreen';
import { ProfileStackParamList } from '@/common/types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStack: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ProfileHome" 
      component={ProfileHomeScreen}
      options={{ title: 'Profile' }}
    />
    {/* <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{ title: 'Edit Profile' }}
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    /> */}
  </Stack.Navigator>
);

export default ProfileStack;