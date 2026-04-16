import { Text, View, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useRef } from 'react';
import { useGetAvailableStylists } from '@/api/user/consultation/useGetAvailableStylists';

const ActiveStylist = () => {
  const { data: availableStylists } = useGetAvailableStylists();
  const activeStylistCount = availableStylists?.total_online_consultants || 0;
  const isStylistActive = activeStylistCount > 0;
  const message = availableStylists?.message || '';
  const { isDark } = useTheme();
  const activeProgress = useRef(new Animated.Value(isStylistActive ? 1 : 0)).current;
  /** Soft “lamp” brightness while online — subtle fade in / fade out loop */
  const lampGlow = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(activeProgress, {
      toValue: isStylistActive ? 1 : 0,
      duration: isStylistActive ? 480 : 400,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isStylistActive, activeProgress]);

  useEffect(() => {
    if (!isStylistActive) {
      lampGlow.setValue(1);
      return;
    }
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(lampGlow, {
          toValue: 0.2,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(lampGlow, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();
    return () => {
      breathe.stop();
      lampGlow.setValue(1);
    };
  }, [isStylistActive, lampGlow]);

  return (
    <View>
      <View className="flex-row">
        <View
          className={` flex-row items-center justify-start gap-2 ${!isStylistActive ? `${isDark ? 'bg-[#222a26]' : 'bg-[#e7e7e7]'}` : `${isDark ? 'bg-[#254c37]' : 'bg-[#cadaca]'}`} rounded-full px-4 py-2`}
        >
          <View className="w-3 h-3 items-center justify-center">
            <Animated.View
              className="absolute w-3 h-3 rounded-full bg-[#7d8a86]"
              style={{
                opacity: activeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              }}
            />
            <Animated.View
              className="absolute w-3 h-3 rounded-full bg-[#2cff88]"
              style={{
                opacity: Animated.multiply(activeProgress, lampGlow),
                shadowColor: '#2cff88',
                shadowOpacity: 0.9,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
                elevation: 4,
              }}
            />
          </View>
          <Text className={`font-semibold  ${isDark ? 'text-white' : 'text-textDark'}`}>
            {isStylistActive ? `${activeStylistCount} ${message}` : `No ${message}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ActiveStylist;
