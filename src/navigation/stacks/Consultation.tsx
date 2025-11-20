import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConsultationHomeScreen from '@/screens/main/consultation/ConsultationHome';
import ConsultationDetailScreen from '@/screens/main/consultation/ConsultationDetail';
import ConsultationChatScreen from '@/screens/main/consultation/ConsultationChat';
import { ConsultationStackParamList } from '@/common/types';

const Stack = createNativeStackNavigator<ConsultationStackParamList>();

const ConsultationStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false, // ← This hides the header
    }}
  >
    <Stack.Screen
      name="ConsultationHome"
      component={ConsultationHomeScreen}
      options={{ title: 'Consultation' }}
    />
    <Stack.Screen
      name="ConsultationDetail"
      component={ConsultationDetailScreen}
      options={{ title: 'Consultation Details' }}
    />
    <Stack.Screen
      name="ConsultationChat"
      component={ConsultationChatScreen}
      options={{ title: 'Chat' }}
    />
  </Stack.Navigator>
);

export default ConsultationStack;
