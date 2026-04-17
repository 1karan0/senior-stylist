import React from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  useWindowDimensions,
  Platform,
} from 'react-native';

import Button from '@/common/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabletLayout } from '@/hooks/useTabletLayout';

interface Props {
  item: {
    id: number;
    title: string;
    description: string;
    image: ImageSourcePropType;
  };
  index: number;
  page: number;
  totalPages: number;
  onNext: () => void;
  onSkip: () => void;
}

const OnboardItem: React.FC<Props> = ({ item, index, page, totalPages, onNext, onSkip }) => {
  const { isDark } = useTheme();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { isLandscape, isTablet } = useTabletLayout();
  const isTabletLandscape = isTablet && isLandscape;
  const isTabletPortrait = isTablet && !isLandscape;
  const isLastPage = page === totalPages - 1;
  const phoneAspectRatio = screenHeight / screenWidth;
  const isTallPhone = !isTablet && !isLandscape && phoneAspectRatio > 2;
  const isCompactPhone = !isTablet && !isLandscape && phoneAspectRatio < 1.85;

  return (
    <View className="flex-1 relative">
      {isTabletLandscape ? (
        <View className="flex-1 flex-row">
          {/* Left side image takes 60% in tablet landscape */}
          <View style={{ width: '60%', height: '100%' }}>
            <Image
              source={item.image}
              resizeMode="cover"
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </View>

          {/* Right side content takes 40% in tablet landscape */}
          <View
            style={{
              width: '40%',
              height: '100%',
              position: 'relative',
              paddingHorizontal: Math.max(48, screenWidth * 0.04),
              paddingTop: Math.max(28, screenHeight * 0.05),
              paddingBottom: Math.max(120, screenHeight * 0.2),
              justifyContent: 'center',
              backgroundColor: isDark ? 'hsl(158, 40%, 11%)' : 'hsl(158, 64%, 95%)',
            }}
          >
            <Text
              className={`text-5xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
              style={{ lineHeight: 56 }}
            >
              {item.title}
            </Text>

            <Text
              className={`text-xl leading-9 font-poppins-normal mt-6 ${
                isDark ? 'text-[#cce6db]' : 'text-[#4c725d]'
              }`}
            >
              {item.description}
            </Text>

            {index === page ? (
              <View
                style={{
                  position: 'absolute',
                  left: Math.max(48, screenWidth * 0.04),
                  right: Math.max(48, screenWidth * 0.04),
                  top: '94%',
                }}
              >
                <View className="flex-row justify-center z-10 mb-4">
                  {Array.from({ length: totalPages }).map((_, i) => (
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

                <View
                  className={`${
                    isLastPage ? 'items-center' : 'flex-row items-center justify-center gap-3'
                  }`}
                  style={{ paddingBottom: 12 }}
                >
                  {/* {!isLastPage && (
                    <Button
                      text="Skip"
                      variant="light"
                      onPress={onSkip}
                      className={`w-[160px] ${isDark ? 'bg-[#0E1B17] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DAE7E0]'} rounded-2xl border`}
                      textClassName={`${isDark ? 'text-[#ffffff]' : 'text-[#162721]'} text-base font-urbanist-bold`}
                    />
                  )} */}

                  <Button
                    text={isLastPage ? 'Elevate my routine' : 'Next'}
                    variant="gradient"
                    onPress={onNext}
                    className={`w-full rounded-2xl`}
                    textClassName={`text-xl`}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <>
          {/* IMAGE */}
          <Image
            source={item.image}
            resizeMode="cover"
            style={{
              width: '100%',
              height: isLandscape ? '70%' : '79%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />

          {/* TEXT SECTION */}
          <View
            style={{
              position: 'absolute',
              top:
                screenHeight *
                (isLandscape
                  ? Platform.OS === 'ios'
                    ? 0.4
                    : 0.38
                  : isTabletPortrait
                    ? 0.61
                    : isTallPhone
                      ? 0.67
                      : isCompactPhone
                        ? 0.65
                        : 0.58),
              left: 0,
              right: 0,
              width: '100%',
              height:
                screenHeight *
                (isLandscape ? 0.45 : isTabletPortrait ? 0.34 : isTallPhone ? 0.32 : 0.3),
              paddingHorizontal: isTabletPortrait ? 20 : 12,
              paddingTop: isLandscape ? 14 : isTabletPortrait ? 34 : isTallPhone ? 20 : 24,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              overflow: 'hidden',
              backgroundColor: isDark ? 'hsl(158, 32%, 12%)' : 'hsl(158, 64%, 95%)',
            }}
          >
            <Text
              className={`${isTabletPortrait ? 'text-5xl' : isTablet ? 'text-5xl' : 'text-2xl'} font-urbanist-bold text-center ${isTabletPortrait ? 'mb-5' : 'mb-3'} ${
                isDark ? 'text-white' : 'text-textDark'
              }`}
            >
              {item.title}
            </Text>

            <Text
              className={`${isTabletPortrait ? 'text-2xl leading-10 pt-2' : isTablet ? 'text-xl leading-8 pt-2' : 'text-base pt-0 leading-6'} font-poppins-normal text-center ${
                isDark
                  ? isTablet
                    ? 'text-[#cce6db]'
                    : 'text-textMuted'
                  : isTablet
                    ? 'text-[#4c725d]'
                    : 'text-[#6b907b]'
              } ${isLandscape ? (isTablet ? 'px-64' : 'px-24') : isTabletPortrait ? 'px-8' : 'px-6'}`}
            >
              {item.description}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

export default OnboardItem;
