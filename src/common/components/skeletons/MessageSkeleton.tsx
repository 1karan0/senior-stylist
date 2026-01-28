import React from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const MessageSkeleton: React.FC = () => {
  const { isDark } = useTheme();
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonBox = ({
    width = '100%',
    height = 16,
    style = {},
  }: {
    width?: string | number;
    height?: number;
    style?: any;
  }) => {
    const widthValue = typeof width === 'number' ? width : width;
    return (
      <Animated.View
        style={[
          {
            width: widthValue,
            height,
            borderRadius: 8,
            backgroundColor: isDark ? '#1E3A33' : '#E0E0E0',
            opacity,
          },
          style,
        ]}
      />
    );
  };

  return (
    <View className={`mb-3 flex-row ${Math.random() > 0.5 ? 'justify-start' : 'justify-end'}`}>
      <View className={`max-w-[70%] ${Math.random() > 0.5 ? 'mr-auto' : 'ml-auto'}`}>
        <SkeletonBox
          width={Math.random() > 0.5 ? '100' : '150'}
          height={48}
          style={{ borderRadius: 12 }}
        />
        <SkeletonBox
          width="50"
          height={20}
          style={{ marginTop: 4, borderRadius: 8, opacity: 0.5 }}
        />
      </View>
    </View>
  );
};

const MessageListSkeleton: React.FC = () => {
  return (
    <View className="flex-1 p-4 ">
      {[...Array(6)].map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </View>
  );
};

export default MessageListSkeleton;
export { MessageSkeleton };
