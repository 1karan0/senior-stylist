import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { RootStackParamList } from '@/common/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// This would come from your authentication context
const userRole = 'consultant'; // or 'customer' - you'll get this from your auth state

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={userRole === 'consultant' ? 'ConsultantApp' : 'UserApp'}
    >
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="UserApp" component={AppStack} />
      <Stack.Screen name="ConsultantApp" component={AppStack} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
