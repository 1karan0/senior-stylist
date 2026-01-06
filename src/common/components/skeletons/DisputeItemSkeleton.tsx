import React from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const DisputeItemSkeleton: React.FC = () => {
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

  const cardBg = isDark
    ? 'bg-[#162721] border border-[#273F36]'
    : 'bg-white border border-[#DAE7E0]';

  return (
    <View className={`rounded-xl p-4 mb-3 border ${cardBg}`}>
      {/* Header Row with Dispute ID and Status */}
      <View>
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <SkeletonBox width="40%" height={14} style={{ marginBottom: 8 }} />
            <SkeletonBox width="60%" height={18} style={{ marginBottom: 8 }} />
            <SkeletonBox width="50%" height={12} style={{ marginBottom: 12 }} />
          </View>
          <SkeletonBox width={80} height={24} style={{ borderRadius: 10 }} />
        </View>
      </View>
      <View
        className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-2`}
      />

      {/* Dispute Details */}
      <View className="flex-row justify-between">
        <View className="flex-1">
          <SkeletonBox width="60%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonBox width="70%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonBox width="80%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonBox width="50%" height={12} style={{ marginBottom: 12 }} />
          <SkeletonBox width={100} height={32} style={{ borderRadius: 10 }} />
        </View>
        <SkeletonBox width={40} height={40} style={{ borderRadius: 8 }} />
      </View>
    </View>
  );
};

const DisputeListSkeleton: React.FC = () => {
  return (
    <>
      {[1, 2, 3, 4].map((item) => (
        <DisputeItemSkeleton key={item} />
      ))}
    </>
  );
};

export default DisputeItemSkeleton;
export { DisputeListSkeleton };
