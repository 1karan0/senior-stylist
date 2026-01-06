import React from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const ConsultationItemSkeleton: React.FC = () => {
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
    ? 'bg-buttonSecondaryText border-commonGradientStop7'
    : 'bg-white border-[#DAE7E0]';

  return (
    <View className={`rounded-[10px] p-4 mb-4 border-2 ${cardBg}`}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-4">
          <View className="flex-row justify-between items-start mb-1">
            <View className="flex-1">
              <SkeletonBox width="70%" height={20} style={{ marginBottom: 8 }} />
              <SkeletonBox width="40%" height={14} style={{ marginBottom: 8 }} />
              <SkeletonBox width="50%" height={12} style={{ marginBottom: 8 }} />
            </View>
            <SkeletonBox width={40} height={40} style={{ borderRadius: 8 }} />
          </View>
          <View
            className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-2`}
          />
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <SkeletonBox width="60%" height={14} style={{ marginBottom: 6 }} />
              <SkeletonBox width="70%" height={14} />
            </View>
            <SkeletonBox width="30%" height={14} />
          </View>
        </View>
      </View>
    </View>
  );
};

const ConsultationListSkeleton: React.FC = () => {
  return (
    <>
      {[1, 2, 3, 4].map((item) => (
        <ConsultationItemSkeleton key={item} />
      ))}
    </>
  );
};

export default ConsultationItemSkeleton;
export { ConsultationListSkeleton };
