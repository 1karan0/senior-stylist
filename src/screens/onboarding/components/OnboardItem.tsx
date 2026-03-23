import React from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  useWindowDimensions,
  Platform,
} from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useTabletLayout } from '@/hooks/useTabletLayout';

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
  const { height: screenHeight } = useWindowDimensions();
  const { isLandscape } = useTabletLayout();

  return (
    <View className="flex-1 relative">
      {/* IMAGE */}
      <Image
        source={item.image}
        resizeMode="cover"
        style={{
          width: '100%',
          // In landscape we give the image a bit more vertical space so text doesn't overlap too much.
          height: isLandscape ? '70%' : '75%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* TEXT SECTION */}
      <View
        style={{
          position: 'absolute',
          // Use dynamic height so this reacts correctly when rotating.
          top:
            screenHeight *
            (isLandscape
              ? typeof Platform.Version === 'number' && Platform.Version < 33
                ? 0.2
                : 0.3
              : typeof Platform.Version === 'number' && Platform.Version < 33
                ? 0.5
                : 0.6),
          left: 0,
          right: 0,
          width: '100%',
          height: screenHeight * (isLandscape ? 0.9 : 0.3),
          paddingHorizontal: 10,
          paddingTop: 30,
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
          className={`text-base font-poppins-normal  text-center leading-6 ${
            isDark ? 'text-textMuted' : 'text-[#8AA897]'
          } ${isLandscape ? 'px-24' : 'px-6'}`}
        >
          {item.description}
        </Text>
      </View>
    </View>
  );
};

export default OnboardItem;
