import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

interface ItemProps {
  item: any;
  onPress?: (item: any) => void;
}

const Itemcard: React.FC<ItemProps> = ({ item, onPress }) => {
  const { isDark } = useTheme();

  return (
    <View
      className={`rounded-xl mb-5 ${isDark ? 'bg-commonGradientStop6 border-commonGradientStop7' : 'bg-white border-gray-200'} shadow-sm border `}
    >
      <View className="absolute top-3 left-3 z-10">
        <LinearGradient
          colors={['#2CCB91', '#23A76F']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 10 }}
          className=" py-2 px-3"
        >
          <Text className=" rounded-lg text-white text-xs font-semibold">
            {item.category?.name}
          </Text>
        </LinearGradient>
      </View>

      <Image
        source={{ uri: item.image_url }}
        className="w-full h-44 rounded-md"
        resizeMode="cover"
      />

      <View className="p-4">
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
          {item.title}
        </Text>

        <Text className={`text-sm mt-1 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}>
          {item.description}
        </Text>

        <View className="mt-3 mb-3 flex-row items-center justify-between">
          <Text className="text-textPrimary font-semibold text-xl">₹{item.display_price}</Text>

          <Text className={`text-sm ${isDark ? 'text-textSecondary' : 'text-gray-500'}`}>
            by {item.provider}
          </Text>
        </View>

        <LinearGradient
          colors={['#2CCB91', '#23A76F']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 10 }}
          className=""
        >
          <TouchableOpacity
            onPress={() => {
              if (item.product_link) Linking.openURL(item.product_link);
              else onPress?.(item);
            }}
            className=" py-3 rounded-xl "
          >
            <Text className="text-white text-center font-semibold">
              {item.buy_now_button_text || 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

export default Itemcard;
