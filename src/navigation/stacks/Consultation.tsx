import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConsultationStackParamList } from '@/common/types';
import Consultation from '@/screens/customer/consultation/Consultation';

import NoConsultant from '@/screens/customer/consultation/NoConsultant';
import NewConsultant from '@/screens/customer/consultation/NewConsultant';
import FindingStylist from '@/screens/customer/consultation/FindingStylist';

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
      name="NoConsultant"
      component={NoConsultant}
      options={{ title: 'No Consultant Available' }}
    />
    <Stack.Screen
      name="NewConsultant"
      component={NewConsultant}
      options={{ title: 'No Consultant Available' }}
    />
    <Stack.Screen
      name="FindingStylist"
      component={FindingStylist}
      options={{ title: 'Finding Stylist' }}
    />
  </Stack.Navigator>
);

export default ConsultationStack;
