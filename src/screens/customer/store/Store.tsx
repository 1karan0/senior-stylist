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
import { useTabletLayout } from '@/hooks/useTabletLayout';
const STORE_URL = 'https://shop.senior-stylist.com/';

const StoreScreen = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const { width: windowWidth } = useWindowDimensions();
  const { horizontalPadding, isTablet } = useTabletLayout();
  // Width-driven sizing is much more consistent than height-driven sizing across devices.
  // The screen uses `px-5` (20px) so the card width is windowWidth - 40.
  const promoCardWidth = Math.max(1, windowWidth - 40);
  const promoCardHeight = isTablet
    ? Math.max(360, Math.min(765, Math.round(promoCardWidth * 1.6)))
    : Math.max(360, Math.min(565, Math.round(promoCardWidth * 1.6)));

  const handleShopNow = () => {
    Linking.openURL(STORE_URL);
  };

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pt-6" style={[{ paddingHorizontal: horizontalPadding }]}>
          {/* Header */}

          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            Products
          </Text>
          <Text className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            Discover our professional hair care collection
          </Text>

          {/* Promo card */}
          <View className="relative">
            <View
              className="w-full mt-3"
              style={{
                height: promoCardHeight,
                borderRadius: 24,
                overflow: 'hidden',
                // Prevent "white corners" in dark mode when the image doesn't perfectly cover.
                backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
              }}
            >
              <Image
                source={require('@/assets/images/discount-card.jpg')}
                resizeMode="cover"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 24,
                  backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
                }}
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
