import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StatusBar } from 'react-native';
import PagerView from 'react-native-pager-view';
import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import onboardData from '@/lib/onboardData';
import LinearGradient from 'react-native-linear-gradient';
import OnboardItem from './components/OnboardItem';

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

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      setPage((prev) => {
        if (prev < onboardData.length - 1) {
          pagerRef.current?.setPage(prev + 1);
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar hidden />
      <View className="flex-1">
        <GradientBackground>
          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={0}
            onPageSelected={(e) => setPage(e.nativeEvent.position)}
          >
            {onboardData.map((item) => (
              <OnboardItem key={item.id} item={item} />
            ))}
          </PagerView>

          {/* DOTS */}
          <View className="flex-row justify-center mb-6 -mt-[20px]">
            {onboardData.map((_, i) => (
              <View
                key={i}
                className={`h-2 mx-1 rounded-full ${
                  i === page
                    ? isDark
                      ? 'bg-green-400 w-6'
                      : 'bg-green-600 w-6'
                    : isDark
                      ? 'bg-gray-600 w-2'
                      : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </View>

          {/* BUTTONS */}
          <View className="flex-row items-center justify-center gap-4 px-6 ">
            {page !== onboardData.length - 1 && (
              <Button
                text="Skip"
                variant="light"
                onPress={() => navigation.replace('Login')}
                className={`w-[160px]  ${isDark ? 'bg-[#0E1B17] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DAE7E0]'} rounded-2xl border`}
                textClassName={`${isDark ? 'text-[#ffffff]' : 'text-[#162721]'} text-base font-urbanist-bold`}
              />
            )}

            <Button
              text={page === onboardData.length - 1 ? 'Get Started' : 'Next'}
              variant="gradient"
              onPress={goNext}
              className={` ${page === onboardData.length - 1 ? 'w-[240px]' : 'w-[160px]'} rounded-2xl`}
            />
          </View>
        </GradientBackground>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
