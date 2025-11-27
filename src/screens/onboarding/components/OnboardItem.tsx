import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  item: {
    id: number;
    title: string;
    description: string;
    icon: ImageSourcePropType;
  };
}

const OnboardItem: React.FC<Props> = ({ item }) => {
  const { isDark } = useTheme();
  return (
    <View className="flex-1 items-center justify-center px-8">
      {/* Icon Container */}
      <LinearGradient
        colors={['#2CCB91', '#23A76F']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24 }}
        className="w-32 h-32 rounded-3xl items-center justify-center shadow-lg mb-8"
      >
        <Image source={item.icon} className="w-16 h-16" resizeMode="contain" />
      </LinearGradient>

      {/* Title */}
      <Text
        className={`text-2xl font-bold text-center  mb-3 ${isDark ? 'text-white' : 'text-textDark'}`}
      >
        {item.title}
      </Text>

      {/* Description */}
      <Text className={`text-center text-base px-6 ${isDark ? 'text-secondary' : 'text-gray-600'}`}>
        {item.description}
      </Text>
    </View>
  );
};

export default OnboardItem;
