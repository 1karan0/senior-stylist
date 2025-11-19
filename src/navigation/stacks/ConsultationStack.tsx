import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConsultationHomeScreen from '@/screens/main/consultation/ConsultationHomeScreen';
import ConsultationDetailScreen from '@/screens/main/consultation/ConsultationDetailScreen';
import ConsultationChatScreen from '@/screens/main/consultation/ConsultationChatScreen';
import { ConsultationStackParamList } from '@/common/types';

const Stack = createNativeStackNavigator<ConsultationStackParamList>();

const ConsultationStack: React.FC = () => (
  <Stack.Navigator>
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