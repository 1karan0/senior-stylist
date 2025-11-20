import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StoreStackParamList } from '@/common/types';
import Store from '@/screens/customer/store/Store';

const Stack = createNativeStackNavigator<StoreStackParamList>();

const StoreStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false, // ← This hides the header
    }}
  >
    <Stack.Screen name="StoreHome" component={Store} options={{ title: 'Store' }} />
  </Stack.Navigator>
);

export default StoreStack;
