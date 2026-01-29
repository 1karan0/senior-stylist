import { View, ActivityIndicator, Text } from 'react-native';
import React from 'react';

import { useGetConsultation } from '@/api/user/consultation/usegetconsultation';
import CustomerChatHome from './ChatHome';
import NoConsultant from './NoConsultant';
import { useTheme } from '@/contexts/ThemeContext';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { useIsFocused } from '@react-navigation/native';
import GradientBackground from '@/common/components/GradientBackground';
import Button from '@/common/components/Button';
import { useAuth } from '@/contexts/AuthContext';

const Consultation = () => {
  const { user, exitGuest } = useAuth();
  const { data, isLoading, isFetching } = useGetConsultation({ enabled: !!user });
  const { isDark } = useTheme();
  const isFocused = useIsFocused();

  const { data: profileData, isLoading: isProfileLoading } = useGetProfile({
    // Poll every 5s while this screen is visible so subscription/profile updates show live
    refetchInterval: isFocused && !!user ? 5_000 : false,
    refetchIntervalInBackground: false,
    enabled: !!user,
  });
  const subscription = profileData?.subscription ?? null;
  const hasSubscription = !!subscription;
  const hasConsultations = (data?.length ?? 0) > 0;
  const shouldShowLoading =
    (isLoading && !hasConsultations && isProfileLoading) || (isProfileLoading && !hasSubscription);

  if (!user) {
    return (
      <GradientBackground>
        <View className="flex-1 px-5 pt-6">
          <Text className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Chats
          </Text>

          <View className="flex-1 items-center justify-center">
            <Text
              className={`text-base text-center mb-4 ${
                isDark ? 'text-textSecondary' : 'text-textMuted'
              }`}
            >
              Please log in to access your consultations.
            </Text>
            <Button text="Login" variant="gradient" onPress={exitGuest} className="w-4/5" />
          </View>
        </View>
      </GradientBackground>
    );
  }

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
      ) : isFetching && !shouldShowLoading ? (
        <GradientBackground>
          <View className="flex-1 px-5 mb-8 mt-4">
            <Text className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} `}>
              Chats
            </Text>
            <Text className={` ${isDark ? 'text-textSecondary' : 'text-gray-500'} mt-1`}>
              Manage your styling sessions
            </Text>
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          </View>
        </GradientBackground>
      ) : (
        <NoConsultant />
      )}
    </View>
  );
};

export default Consultation;
