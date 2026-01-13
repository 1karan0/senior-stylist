import { View, ActivityIndicator } from 'react-native';
import React from 'react';

import { useGetConsultation } from '@/api/user/consultation/usegetconsultation';
import CustomerChatHome from './ChatHome';
import NoConsultant from './NoConsultant';
import { useTheme } from '@/contexts/ThemeContext';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { useIsFocused } from '@react-navigation/native';

const Consultation = () => {
  const { data, isLoading } = useGetConsultation();
  const { isDark } = useTheme();
  const isFocused = useIsFocused();

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
