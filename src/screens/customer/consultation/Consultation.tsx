import { View, Text, ActivityIndicator } from 'react-native';
import React from 'react';

import { useGetConsultation } from '@/api/user/consultation/usegetconsultation';
import NoConsultant from './NoConsultant';
import Chat from './Chat';
import { useTheme } from '@/contexts/ThemeContext';
import ChatHome from '@/screens/consulant/chat/Home';
import CustomerChatHome from './ChatHome';

const Consultation = ({ navigation }: any) => {
  const { data, isLoading } = useGetConsultation();
  const { isDark } = useTheme();

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0B1E16]' : 'bg-white'} `}>
      {/* Loading State */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : data?.length > 0 ? (
        <CustomerChatHome />
      ) : (
        <NoConsultant />
      )}
    </View>
  );
};

export default Consultation;
