import { Text, View, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useRef } from 'react';
import { useGetAvailableStylists } from '@/api/user/consultation/useGetAvailableStylists';

const ActiveStylist = () => {
  const { data: availableStylists } = useGetAvailableStylists();
  const activeStylistCount = availableStylists?.total_online_consultants || 0;
  const message = availableStylists?.message || '';
  const { isDark } = useTheme();
  const dotOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!activeStylistCount) {
      dotOpacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 0.35,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      dotOpacity.setValue(1);
    };
  }, [activeStylistCount, dotOpacity]);

  return (
    <View>
      <View className="flex-row">
        <View
          className={` flex-row items-center justify-start gap-2 ${!activeStylistCount ? `${isDark ? 'bg-[#222a26]' : 'bg-[#e7e7e7]'}` : `${isDark ? 'bg-[#254c37]' : 'bg-[#cadaca]'}`} rounded-full px-4 py-2`}
        >
          {activeStylistCount ? (
            <Animated.View
              className="w-3 h-3 bg-[#66cb76] rounded-full"
              style={{ opacity: dotOpacity }}
            />
          ) : (
            <View className="w-3 h-3 bg-[#7d8a86] rounded-full" />
          )}
          <Text className={`font-semibold  ${isDark ? 'text-white' : 'text-textDark'}`}>
            {activeStylistCount && activeStylistCount >= 0
              ? `${activeStylistCount} ${message}`
              : `No ${message}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ActiveStylist;
