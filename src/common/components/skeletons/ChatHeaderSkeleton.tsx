import React from 'react';
import { View, Animated, StatusBar } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const ChatHeaderSkeleton: React.FC = () => {
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
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            opacity,
          },
          style,
        ]}
      />
    );
  };

  return (
    <View>
      <StatusBar translucent backgroundColor="#36D399" barStyle="light-content" />
      <View className="bg-commonGradientStop2 pt-16 pb-7 px-4 rounded-b-3xl">
        <View className="flex-row items-center">
          {/* Back Button Skeleton */}
          <SkeletonBox width="40" height={40} style={{ borderRadius: 8, marginRight: 12 }} />

          {/* Avatar Skeleton */}
          <SkeletonBox width="48" height={48} style={{ borderRadius: 24, marginRight: 12 }} />

          {/* Text Content Skeleton */}
          <View className="flex-1">
            <SkeletonBox width="60%" height={18} style={{ marginBottom: 6 }} />
            <SkeletonBox width="40%" height={14} />
          </View>

          {/* Finish Button Skeleton */}
          <SkeletonBox width="80" height={32} style={{ borderRadius: 12 }} />
        </View>

        {/* Status Indicator Skeleton */}
        <View style={{ marginTop: 12 }}>
          <SkeletonBox width="120" height={20} style={{ borderRadius: 12 }} />
        </View>
      </View>
    </View>
  );
};

export default ChatHeaderSkeleton;
