import React from 'react';
import { View, Text, Image } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useGetProfile } from '@/api/user/profile/useGetProfile';

type RootStackParamList = {
  NewConsultant: undefined;
  // add other routes here if needed
};

const NoConsultant = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const { data: profileData } = useGetProfile({
    // Poll every 5s while this screen is visible so subscription/profile updates show live
    refetchInterval: isFocused ? 5_000 : false,
    refetchIntervalInBackground: false,
  });
  const subscription = profileData?.subscription ?? null;
  const hasSubscription = !!subscription;

  const handleNavigateToPricing = () => {
    // Navigate to Pricing screen in AppStack (parent navigator)
    // ConsultationStack is nested in UserTabs, which is in AppStack
    // We need to navigate to the AppStack level to access Pricing
    const tabNavigator = navigation.getParent?.(); // ConsultationStack -> UserTabs (Tab)
    const appStackNavigator = tabNavigator?.getParent?.(); // UserTabs (Tab) -> AppStack (Stack)

    if (appStackNavigator) {
      console.log('[NoSubscription] Navigating to Pricing screen via AppStack navigator');
      // @ts-ignore - Pricing is defined in AppStack
      appStackNavigator.navigate('Pricing', { fromConsultation: true });
      return;
    }

    if (tabNavigator) {
      console.log('[NoSubscription] AppStack navigator not found, trying tab navigator');
      // @ts-ignore - might work in alternative navigator setups
      tabNavigator.navigate('Pricing', { fromConsultation: true });
      return;
    }

    console.log('[NoSubscription] Parent navigator not found, trying direct navigation');
    // @ts-ignore
    navigation.navigate('Pricing', { fromConsultation: true });
  };

  return (
    <GradientBackground className="">
      <View className="flex-1 px-5 pt-6 ">
        {/* Header */}
        <Text className={`text-[26px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'} `}>
          Chats
        </Text>
        <Text className={` ${isDark ? 'text-textSecondary' : 'text-gray-500'} mt-1`}>
          Manage your styling sessions
        </Text>

        {/* Card */}
        <View
          className={` ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-gray-100'} rounded-2xl shadow-md mt-10 p-6 items-center border `}
        >
          {/* Chat Icon */}
          <View className="w-14 h-14 rounded-full border border-green-500 flex items-center justify-center mb-4">
            <Image
              source={require('@/assets/icons/chat-empty.png')}
              className="w-7 h-7"
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text
            className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}  mb-1`}
          >
            {hasSubscription ? 'No Chat' : 'Subscription Required'}
          </Text>

          {/* Subtitle */}
          <Text
            className={` ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-center px-4 mb-6`}
          >
            {hasSubscription
              ? 'You don’t have any conversations yet. Tap the button below to find an expert to get started!'
              : "You don't have an active subscription. To view and manage your consultations, please subscribe to one of our plans first."}
          </Text>

          {/* Button */}
          <Button
            text={hasSubscription ? 'Find a Consultant' : 'Get Subscription'}
            onPress={() =>
              hasSubscription ? navigation.navigate('NewConsultant') : handleNavigateToPricing()
            }
            variant="gradient"
            className="w-full"
            icon={
              hasSubscription ? (
                <Image
                  source={require('@/assets/icons/white-search-icon.png')}
                  className="w-5 h-5 mr-2"
                  resizeMode="contain"
                />
              ) : undefined
            }
          />
        </View>
      </View>
    </GradientBackground>
  );
};

export default NoConsultant;
