import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';

const STORE_URL = 'https://shop.senior-stylist.com/';

const StoreScreen = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const { height: windowHeight } = useWindowDimensions();

  // Keep the promo card large, but responsive across devices.
  const promoCardHeight = Math.min(610, Math.max(560, windowHeight * 0.62));

  const handleShopNow = () => {
    Linking.openURL(STORE_URL);
  };

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-5 pt-4">
          {/* Header */}
          <View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Products
            </Text>
            <Text className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
              Discover our professional hair care collection
            </Text>
          </View>

          {/* Promo card */}
          <View className=" relative">
            <Image
              source={require('@/assets/images/discount-card.jpg')}
              className="w-full h-full mt-6"
              resizeMode="contain"
              style={{
                height: promoCardHeight,
              }}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleShopNow}
              className=" bg-white absolute bottom-16 rounded-[10px] self-center px-10 py-3"
            >
              <Text className="text-base font-urbanist-bold text-[#0F172A]">Shop Now</Text>
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
