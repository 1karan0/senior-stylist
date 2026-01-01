import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/common/types';
import EditProfile from '@/screens/customer/profile/EditProfile';
import Profile from '@/screens/customer/profile/Profile';
import Settings from '@/screens/customer/profile/Settings';
import CreateDispute from '@/screens/customer/dispute/CreateDispute';
import SubmitDispute from '@/screens/customer/dispute/SubmitDispute';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false, // ← This hides the header
    }}
  >
    <Stack.Screen name="ProfileHome" component={Profile} options={{ title: 'Profile' }} />
    <Stack.Screen name="EditProfile" component={EditProfile} options={{ title: 'Edit Profile' }} />
    <Stack.Screen name="Settings" component={Settings} options={{ title: 'Settings' }} />
    <Stack.Screen
      name="CreateDispute"
      component={CreateDispute}
      options={{ title: 'Create Dispute' }}
    />
    <Stack.Screen
      name="SubmitDispute"
      component={SubmitDispute}
      options={{ title: 'Submit Dispute' }}
    />
  </Stack.Navigator>
);

export default ProfileStack;
