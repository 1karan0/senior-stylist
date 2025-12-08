import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
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
    <View className="flex-1 relative">
      {/* IMAGE FIX — remove bottom offset + use cover */}
      <Image
        source={item.image}
        resizeMode="cover"
        className="w-full h-[75%] absolute top-0 left-0"
      />

      {/* TEXT SECTION */}
      <LinearGradient
        colors={
          isDark
            ? ['hsl(158, 32%, 12%)', 'hsl(158, 32%, 8%)']
            : ['hsl(158, 64%, 95%)', 'hsl(146, 25%, 97%)']
        }
        className="absolute bottom-0 w-full h-[32%] px-5 pt-10"
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={{
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          overflow: 'hidden',
        }}
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
