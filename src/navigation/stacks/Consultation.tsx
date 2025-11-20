import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConsultationStackParamList } from '@/common/types';
import Chat from '@/screens/customer/consultation/Chat';
import Consultation from '@/screens/customer/consultation/Consultation';
import Details from '@/screens/customer/consultation/Details';

const Stack = createNativeStackNavigator<ConsultationStackParamList>();

const ConsultationStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false, // ← This hides the header
    }}
  >
    <Stack.Screen
      name="ConsultationHome"
      component={Consultation}
      options={{ title: 'Consultation' }}
    />
    <Stack.Screen
      name="ConsultationDetail"
      component={Details}
      options={{ title: 'Consultation Details' }}
    />
    <Stack.Screen name="ConsultationChat" component={Chat} options={{ title: 'Chat' }} />
  </Stack.Navigator>
);

export default ConsultationStack;
