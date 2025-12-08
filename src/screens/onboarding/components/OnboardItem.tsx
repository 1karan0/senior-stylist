import React from 'react';
import { View, Text, Image, ImageSourcePropType, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
        style={{
          width: '100%',
          height: '75%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* TEXT SECTION */}
      <View
        style={{
          position: 'absolute',
          top: SCREEN_HEIGHT * 0.6, // Start at 70% (just above where 75% image ends)
          left: 0,
          right: 0,
          width: '100%',
          height: SCREEN_HEIGHT * 0.3, // 30% height to ensure it reaches bottom
          paddingHorizontal: 20,
          paddingTop: 40,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          overflow: 'hidden',
          backgroundColor: isDark ? 'hsl(158, 32%, 12%)' : 'hsl(158, 64%, 95%)',
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
      </View>
    </View>
  );
};

export default OnboardItem;
