import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const ItemCard = ({ item }: any) => {
  const { isDark } = useTheme();

  return (
    <View
      className={`rounded-[10px] overflow-hidden border ${
        isDark ? 'bg-commonGradientStop6 border-commonGradientStop7' : 'bg-white border-gray-200'
      }`}
      style={{ height: 300 }}
    >
      {/* Image */}
      <View className="relative">
        <Image source={{ uri: item.image_url }} className="w-full z-0 h-36" resizeMode="cover" />

        {/* Tag */}

        <View className="absolute z-50 top-2 left-2 bg-[#00C896] px-2 py-1 rounded-[10px]">
          <Text className="text-white text-[14px] font-urbanist-bold">{item.category?.slug}</Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-3 flex-1 justify-between">
        <View className="flex-1">
          <Text className="text-xs text-textMuted" numberOfLines={1}>
            {item.provider}
          </Text>
          <Text
            className={`font-poppins-semibold text-base mt-1 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="font-poppins-semibold text-base text-[#00C896]">
              ₹{item.display_price}
            </Text>
          </View>
        </View>
        <TouchableOpacity className="bg-[#00C896] px-5 py-2 rounded-[5px] mt-2">
          <Text className="text-white text-sm text-center font-poppins-semibold">Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ItemCard;
