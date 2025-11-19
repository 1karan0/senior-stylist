import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { RootStackParamList } from '@/common/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  // For testing, you can change the initialRouteName to 'Main'
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="Main" // Change to 'Auth' when you want auth screens
    >
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="Main" component={AppStack} />
    </Stack.Navigator>
  );
};

export default AppNavigator;