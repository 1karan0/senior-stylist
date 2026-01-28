import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';

import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';

const STORE_URL = 'https://shop.senior-stylist.com/';

const StoreScreen = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();

  const handleShopNow = () => {
    Linking.openURL(STORE_URL);
  };

  return (
    <GradientBackground>
      <View className="flex-1 px-5 pt-6" style={{ paddingBottom }}>
        {/* Header */}
        <Text className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
          Products
        </Text>

        {/* Center Content */}
        <View className="flex-1 items-center justify-center">
          <View
            className={`w-full rounded-2xl overflow-hidden ${
              isDark ? 'bg-commonGradientStop6' : 'bg-white'
            }`}
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Promo Image */}
            <Image
              source={require('../../../assets/images/store-promo.png')}
              className="w-full h-44"
              resizeMode="cover"
            />

            {/* CTA Section */}
            <View className="items-center py-6 px-4">
              <TouchableOpacity
                onPress={handleShopNow}
                activeOpacity={0.85}
                className="bg-[#00C896] px-12 py-3 rounded-full"
              >
                <Text className="text-white text-base font-semibold">Shop Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Compliance helper text */}
          <Text
            className={`text-xs text-center mt-4 px-6 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            You’ll be redirected to our official website to explore and purchase products.
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
};

export default StoreScreen;
