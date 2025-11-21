import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConsultationStackParamList } from '@/common/types';
import Chat from '@/screens/customer/consultation/Chat';
import Consultation from '@/screens/customer/consultation/Consultation';
import Details from '@/screens/customer/consultation/Details';
import NoConsultant from '@/screens/customer/consultation/NoConsultant';
import NewConsultant from '@/screens/customer/consultation/NewConsultant';

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
    <Stack.Screen
      name="NoConsultant"
      component={NoConsultant}
      options={{ title: 'No Consultant Available' }}
    />
    <Stack.Screen
      name="NewConsultant"
      component={NewConsultant}
      options={{ title: 'No Consultant Available' }}
    />
    <Stack.Screen name="ConsultationChat" options={{ title: 'Chat' }}>
      {(props) => <Chat {...(props as any)} />}
    </Stack.Screen>
  </Stack.Navigator>
);

export default ConsultationStack;
