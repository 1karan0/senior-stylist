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
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!isStylistActive) {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 2.5,
            duration: 1500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0.7,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
    };
  }, [isStylistActive, pulseOpacity, pulseScale]);

  return (
    <View>
      <View className="flex-row">
        <View
          className={` flex-row items-center justify-start gap-2 ${!isStylistActive ? `${isDark ? 'bg-[#222a26]' : 'bg-[#e7e7e7]'}` : `${isDark ? 'bg-[#254c37]' : 'bg-[#cadaca]'}`} rounded-full px-4 py-2`}
        >
          {isStylistActive ? (
            <View className="w-3 h-3 items-center justify-center">
              <Animated.View
                className="absolute w-3 h-3 rounded-full bg-[#2cff88]"
                style={{
                  opacity: pulseOpacity,
                  transform: [{ scale: pulseScale }],
                }}
              />
              <View
                className="w-3 h-3 rounded-full bg-[#2cff88]"
                style={{
                  shadowColor: '#2cff88',
                  shadowOpacity: 0.9,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 4,
                }}
              />
            </View>
          ) : (
            <View className="w-3 h-3 bg-[#7d8a86] rounded-full" />
          )}
          <Text className={`font-semibold  ${isDark ? 'text-white' : 'text-textDark'}`}>
            {isStylistActive ? `${activeStylistCount} ${message}` : `No ${message}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ActiveStylist;
