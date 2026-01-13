import React from 'react';
import { View, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';

const NoSubscription = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { isDark } = useTheme();

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
    <GradientBackground className="flex-1 px-5 pt-6 ">
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
        {/* Lock Icon */}
        <View className="w-14 h-14 rounded-full border border-buttonPrimaryBg flex items-center justify-center mb-4">
          <Image
            source={require('@/assets/icons/lock.png')}
            className="w-7 h-7"
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}  mb-1`}>
          Subscription Required
        </Text>

        {/* Subtitle */}
        <Text
          className={` ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-center px-4 mb-6`}
        >
          You don't have an active subscription. To view and manage your consultations, please
          subscribe to one of our plans first.
        </Text>

        {/* Button */}
        <Button
          text="Get Subscription"
          onPress={handleNavigateToPricing}
          variant="gradient"
          className="w-full"
        />
      </View>
    </GradientBackground>
  );
};

export default NoSubscription;
