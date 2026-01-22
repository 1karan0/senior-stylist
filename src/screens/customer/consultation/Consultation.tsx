import { View, ActivityIndicator } from 'react-native';
import React from 'react';

import { useGetConsultation } from '@/api/user/consultation/usegetconsultation';
import CustomerChatHome from './ChatHome';
import NoConsultant from './NoConsultant';
import { useTheme } from '@/contexts/ThemeContext';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { useIsFocused } from '@react-navigation/native';
import GradientBackground from '@/common/components/GradientBackground';

const Consultation = () => {
  const { data, isLoading, isFetching } = useGetConsultation();
  const { isDark } = useTheme();
  const isFocused = useIsFocused();

  const { data: profileData, isLoading: isProfileLoading } = useGetProfile({
    // Poll every 5s while this screen is visible so subscription/profile updates show live
    refetchInterval: isFocused ? 5_000 : false,
    refetchIntervalInBackground: false,
  });
  const subscription = profileData?.subscription ?? null;
  const hasSubscription = !!subscription;
  const hasConsultations = (data?.length ?? 0) > 0;
  const shouldShowLoading =
    (isLoading && !hasConsultations && isProfileLoading) || (isProfileLoading && !hasSubscription);
  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0B1E16]' : 'bg-white'} `}>
      {/* Loading State */}
      {shouldShowLoading ? (
        <GradientBackground>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        </GradientBackground>
      ) : hasConsultations && hasSubscription ? (
        <CustomerChatHome />
      ) : isProfileLoading ? (
        <GradientBackground>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        </GradientBackground>
      ) : (
        <NoConsultant />
      )}
      {isFetching && !shouldShowLoading ? (
        <GradientBackground className="flex-1">
          <View className="absolute right-3 top-3">
            <ActivityIndicator size="small" />
          </View>
        </GradientBackground>
      ) : null}
    </View>
  );
};

export default Consultation;
