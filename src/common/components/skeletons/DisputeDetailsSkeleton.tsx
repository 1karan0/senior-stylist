import React from 'react';
import { View, Animated, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const DisputeDetailsSkeleton: React.FC = () => {
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
    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
      {/* Consultation Details Section */}
      <View className={`rounded-xl p-4 mb-4 border ${cardBg}`}>
        <SkeletonBox width="50%" height={18} style={{ marginBottom: 12 }} />
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <SkeletonBox width="40%" height={14} />
            <SkeletonBox width="35%" height={14} />
          </View>
          <View
            className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-2`}
          />
          <View className="flex-row items-center justify-between mb-2">
            <SkeletonBox width="20%" height={14} />
            <SkeletonBox width="40%" height={14} />
          </View>
          <View
            className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-2`}
          />
          <View className="flex-row items-center justify-between">
            <SkeletonBox width="30%" height={14} />
            <SkeletonBox width="35%" height={14} />
          </View>
        </View>
      </View>

      {/* Conversation Section */}
      <View className="mb-4">
        <SkeletonBox width="40%" height={18} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map((item) => (
          <View key={item} className={`my-1 ${item % 2 === 0 ? 'items-end' : 'items-start'}`}>
            <View
              className={`w-full p-3 border rounded-xl ${
                isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
              }`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <SkeletonBox width="20%" height={16} />
                <SkeletonBox width="15%" height={10} />
              </View>
              <SkeletonBox width="90%" height={14} style={{ marginBottom: 4 }} />
              <SkeletonBox width="70%" height={14} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default DisputeDetailsSkeleton;
