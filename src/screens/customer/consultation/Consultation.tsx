import { View, Text } from 'react-native';
import React from 'react';

import { useGetConsultation } from '@/api/user/consultation/usegetconsultation';
import NoConsultant from './NoConsultant';
import Chat from './Chat';

const Consultation = ({ navigation }: any) => {
  const { data, isLoading } = useGetConsultation();
  console.log('consultation data', data);

  return (
    <View className="flex-1">
      {data?.length ? <Chat data={data} isLoading={isLoading} /> : <NoConsultant />}
    </View>
  );
};

export default Consultation;
