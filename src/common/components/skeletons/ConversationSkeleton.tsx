import React from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const ConversationSkeleton: React.FC = () => {
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
    <View
      className={`${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} shadow-sm border rounded-xl px-4 py-4 mb-2 flex-row items-center`}
    >
      {/* Avatar Skeleton */}
      <SkeletonBox width="48" height={48} style={{ borderRadius: 24, marginRight: 16 }} />

      {/* Content Skeleton */}
      <View className="flex-1">
        {/* Name Skeleton */}
        <SkeletonBox width="60%" height={16} style={{ marginBottom: 8 }} />
        {/* Message Skeleton */}
        <SkeletonBox width="80%" height={14} />
      </View>

      {/* Right Content Skeleton */}
      <View className="items-end ml-2">
        {/* Time Skeleton */}
        <SkeletonBox width="40" height={12} style={{ marginBottom: 8 }} />
        {/* Badge Skeleton */}
        <SkeletonBox width="24" height={24} style={{ borderRadius: 12 }} />
      </View>
    </View>
  );
};

export default ConversationSkeleton;
