import React from 'react';
import { View, Text, Image, ImageSourcePropType, StatusBar } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  item: {
    id: number;
    title: string;
    description: string;
    image: ImageSourcePropType;
  };
}

const OnboardItem: React.FC<Props> = ({ item }) => {
  const { isDark } = useTheme();

  return (
    <View className="flex-1">
      {/* FULLSCREEN IMAGE */}
      <Image source={item.image} className="w-full h-full absolute bottom-40" />

      {/* TEXT SECTION */}
      <LinearGradient
        colors={
          isDark
            ? ['hsl(158, 32%, 12%)', 'hsl(158, 32%, 8%)'] // Reverse of DARK_BG for bottom-up
            : ['hsl(158, 64%, 95%)', 'hsl(146, 25%, 97%)'] // Reverse of LIGHT_BG
        }
        className="absolute bottom-0 w-full h-[30%] px-5 pb-5 pt-8 "
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
      >
        <Text
          className={`text-2xl font-urbanist-bold text-center mb-3 ${
            isDark ? 'text-white' : 'text-textDark'
          }`}
        >
          {item.title}
        </Text>

        <Text
          className={`text-base font-poppins-regular text-center px-6 leading-6 ${
            isDark ? 'text-textMuted' : 'text-[#8AA897]'
          }`}
        >
          {item.description}
        </Text>
      </LinearGradient>
    </View>
  );
};

export default OnboardItem;
