import React, { useEffect, useRef, useState } from 'react';
import { View, StatusBar, Platform } from 'react-native';
import PagerView from 'react-native-pager-view';

import Button from '@/common/components/Button';
import OnboardItem from './components/OnboardItem';
import { useTheme } from '@/contexts/ThemeContext';
import onboardData from '@/lib/onboardData';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { SafeAreaView } from 'react-native-safe-area-context';

const OnboardingScreen = ({ navigation }: any) => {
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const { isDark } = useTheme();
  const { isTablet, isLandscape } = useTabletLayout();
  const isTabletLandscape = isTablet && isLandscape;
  const isTabletPortrait = isTablet && !isLandscape;
  const goNext = () => {
    if (page < onboardData.length - 1) {
      pagerRef.current?.setPage(page + 1);
    } else {
      navigation.replace('MainLogin');
    }
  };

  // Auto-slide
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setPage((prev) => {
  //       if (prev < onboardData.length - 1) {
  //         pagerRef.current?.setPage(prev + 1);
  //         return prev + 1;
  //       } else {
  //         clearInterval(interval);
  //         return prev;
  //       }
  //     });
  //   }, 3500);

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <View
      className="flex-1 "
      style={{
        backgroundColor: isDark ? 'hsl(158, 32%, 12%)' : 'hsl(158, 64%, 95%)',
      }}
    >
      <StatusBar hidden />
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {onboardData.map((item, index) => (
          <OnboardItem
            key={item.id}
            item={item}
            index={index}
            page={page}
            totalPages={onboardData.length}
            onNext={goNext}
            onSkip={() => navigation.replace('Login')}
          />
        ))}
      </PagerView>

      {!isTabletLandscape ? (
        <SafeAreaView edges={['bottom', 'left', 'right']}>
          <View>
            {/* DOTS */}
            <View
              className={`flex-row justify-center z-10 ${
                isLandscape ? (isTablet ? 'mb-6' : 'mb-4') : 'mb-7'
              }`}
              style={{
                marginBottom: isTabletPortrait ? 18 : 15,
              }}
            >
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
            <View
              className={`${
                page === onboardData.length - 1
                  ? 'items-center'
                  : 'flex-row items-center justify-center gap-4'
              } ${isTabletPortrait ? 'px-8' : 'px-6'}`}
              style={{
                marginBottom: isTabletPortrait ? 16 : Platform.OS === 'android' ? 10 : 0,
                paddingBottom: isTabletPortrait ? 18 : isLandscape ? (isTablet ? 12 : 1) : 5,
              }}
            >
              {/* {page !== onboardData.length - 1 && (
                <Button
                  text="Skip"
                  variant="light"
                  onPress={() => navigation.replace('Login')}
                  className={`w-[160px]  ${isDark ? 'bg-[#0E1B17] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DAE7E0]'} rounded-2xl border`}
                  textClassName={`${isDark ? 'text-[#ffffff]' : 'text-[#162721]'} ${isTabletPortrait ? 'text-xl' : 'text-base'} font-urbanist-bold`}
                />
              )} */}

              <Button
                text={page === onboardData.length - 1 ? 'Elevate my routine' : 'Next'}
                variant="gradient"
                onPress={goNext}
                className={`${
                  isLandscape ? 'px-24 w-[70%]' : isTabletPortrait ? 'w-[60%]' : 'w-[68%]'
                } rounded-2xl`}
                textClassName={`${isTabletPortrait ? 'text-xl font-urbanist-bold' : `${isTabletPortrait ? 'text-xl' : 'text-base'}`}`}
              />
            </View>
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
};

export default OnboardingScreen;
