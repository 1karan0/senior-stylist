import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, ScrollView, Platform } from 'react-native';

import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import ActiveStylist from '@/common/components/ActiveStylists';
import { useAuth } from '@/contexts/AuthContext';
import CompleteQuestions from '@/common/components/CompleteQuestions';
const STORE_URL = 'https://shop.senior-stylist.com/';

const StoreScreen = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const { horizontalPadding, isTablet, isLandscape, maxContentWidth } = useTabletLayout();
  // Width-driven sizing is much more consistent than height-driven sizing across devices.
  // Base width on the same content width we use elsewhere so tablet landscape looks centered.
  // On Android < 13 (SDK < 33), subtract a bit more so the promo card
  // doesn't appear overly wide on older devices.
  const platformOffset = isLandscape
    ? 200
    : Platform.OS === 'ios'
      ? 160
      : typeof Platform.Version === 'number' && Platform.Version < 33
        ? 170
        : 140;

  const promoCardWidth = Math.max(1, maxContentWidth - platformOffset);

  // Slightly different aspect ratio caps for landscape vs portrait for better fit.
  const baseAspectRatio = isLandscape ? 1.2 : 1.6;
  const promoCardHeight = Math.max(
    isLandscape ? 700 : 500,
    Math.min(640, Math.round(promoCardWidth * baseAspectRatio))
  );

  const handleShopNow = () => {
    Linking.openURL(STORE_URL);
  };

  const { user } = useAuth();
  const isQuestionnaireCompleted = user?.customer_questionnaire_completed_at === null;
  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pt-6 pb-10" style={[{ paddingHorizontal: horizontalPadding }]}>
          {/* Header */}
          {isQuestionnaireCompleted && <CompleteQuestions />}
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            Products
          </Text>
          <Text className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            Discover our professional hair care collection
          </Text>
          <View className="mt-4">
            <ActiveStylist />
          </View>

          {/* Promo card */}
          <View className="relative mt-6">
            <View className="w-full mt-3 mx-auto items-center justify-center">
              <Image
                source={require('@/assets/images/discount-card.jpg')}
                resizeMode="cover"
                style={{
                  borderRadius: 24,
                }}
                width={promoCardWidth}
                height={promoCardHeight}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleShopNow}
              className=" bg-[#27B07D] absolute bottom-16 rounded-[5px] self-center px-10 py-3"
            >
              <Text className="text-base font-poppins-semibold text-white">Shop Now</Text>
            </TouchableOpacity>
          </View>
          {/* Compliance helper text */}
          <View>
            <Text
              className={`text-[13px] mt-4 font-poppins-medium text-center px-6 ${
                isDark ? 'text-[#94A3B8]' : 'text-[#658176]'
              }`}
            >
              You’ll be redirected to our official website to explore and purchase products.
            </Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

export default StoreScreen;
