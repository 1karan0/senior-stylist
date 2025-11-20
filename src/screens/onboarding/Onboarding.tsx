import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import PagerView from 'react-native-pager-view';
import OnboardItem from './components/OnboardItem';
import onboardData from '../../lib/onboardData';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';

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

  return (
    <GradientBackground>
      <View className="flex-1 px-6">
        {/* Pager */}
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={(e) => setPage(e.nativeEvent.position)}
        >
          {onboardData.map((item) => (
            <View key={item.id}>
              <OnboardItem item={item} />
            </View>
          ))}
        </PagerView>

        {/* Page Indicators */}
        <View className="flex-row justify-center mb-4">
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
        <View className="flex-row items-center justify-center gap-4 px-6 mb-8">
          <TouchableOpacity
            onPress={() => navigation.replace('Login')}
            className={`px-5 py-2 w-48 rounded-2xl items-center border ${
              isDark ? 'bg-gray-800 border-gray-600' : 'bg-[#F5F9F7] border-[#DAE7E0]'
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
            <TouchableOpacity onPress={goNext} className="px-5 py-2 w-48 rounded-2xl items-center">
              <Text className="text-white text-base font-bold">
                {page === onboardData.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </GradientBackground>
  );
};

export default OnboardingScreen;
