import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import PagerView from 'react-native-pager-view';
import LinearGradient from 'react-native-linear-gradient';
import OnboardItem from './components/OnboardItem';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import onboardData from '@/lib/onboardData';
import { SafeAreaView } from 'react-native-safe-area-context';

const OnboardingScreen = ({ navigation }: any) => {
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const { isDark } = useTheme();

  const goNext = () => {
    if (page < onboardData.length - 1) {
      pagerRef.current?.setPage(page + 1);
    } else {
      navigation.replace('Login');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPage((prev) => {
        if (prev < onboardData.length - 1) {
          pagerRef.current?.setPage(prev + 1);
          return prev + 1;
        } else {
          clearInterval(interval); // stop sliding at last screen
          return prev;
        }
      });
    }, 3500); // 1.5s for softer vibes

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GradientBackground>
        <View className="flex-1 px-5 pb-3">
          {/* Pager */}
          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={0}
            onPageSelected={(e) => setPage(e.nativeEvent.position)}
          >
            {onboardData.map((item) => (
              <View key={item.id} className="flex-1">
                <OnboardItem item={item} />
              </View>
            ))}
          </PagerView>

          {/* Page Indicators — now directly under Pager with tighter spacing */}
          <View className="flex-row justify-center mt-3 mb-6">
            {onboardData.map((_, i) => (
              <View
                key={i}
                className={`h-2 mx-1 rounded-full ${
                  i === page
                    ? isDark
                      ? 'bg-green-400 w-6'
                      : 'bg-green-500 w-6'
                    : isDark
                      ? 'bg-gray-600 w-2'
                      : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </View>

          {/* Buttons */}
          <View className="flex-row items-center justify-center gap-4 px-6 mb-10">
            <TouchableOpacity
              onPress={() => navigation.replace('Login')}
              className={`px-5 py-2 w-44 rounded-2xl items-center border ${
                isDark
                  ? 'bg-commonGradientStop6 border-commonGradientStop7'
                  : 'bg-[#F5F9F7] border-[#DAE7E0]'
              }`}
            >
              <Text
                className={`text-base font-urbanist-bold ${isDark ? 'text-white' : 'text-gray-800'}`}
              >
                Skip
              </Text>
            </TouchableOpacity>

            <LinearGradient
              colors={['#2CCB91', '#23A76F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 14 }}
            >
              <TouchableOpacity
                onPress={goNext}
                className="px-5 py-2 w-44 rounded-2xl items-center"
              >
                <Text className="text-white text-base font-bold">
                  {page === onboardData.length - 1 ? 'Get Started' : 'Next'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </GradientBackground>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
