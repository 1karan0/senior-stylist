import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import QuestionsModal from './modals/Questionsmodal';

const SHEEN_WIDTH = 88;

const CompleteQuestions: React.FC = () => {
  const { isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(true);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const chevronNudge = useRef(new Animated.Value(0)).current;
  const sheenX = useRef(new Animated.Value(-SHEEN_WIDTH)).current;

  const sweepEndX = Math.max(280, windowWidth * 0.95);

  const handlePress = () => {
    setShowQuestionsModal(true);
  };

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;
    const syncReduceMotion = (value: boolean) => setReduceMotion(value);
    void AccessibilityInfo.isReduceMotionEnabled().then(syncReduceMotion);
    if (typeof AccessibilityInfo.addEventListener === 'function') {
      subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', syncReduceMotion);
    }
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const nudgeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronNudge, {
          toValue: 5,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(chevronNudge, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ])
    );
    nudgeLoop.start();
    return () => {
      nudgeLoop.stop();
      chevronNudge.setValue(0);
    };
  }, [reduceMotion, chevronNudge]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const sheenLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sheenX, {
          toValue: -SHEEN_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1600),
        Animated.timing(sheenX, {
          toValue: sweepEndX,
          duration: 520,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(1400),
      ])
    );
    sheenLoop.start();
    return () => {
      sheenLoop.stop();
      sheenX.setValue(-SHEEN_WIDTH);
    };
  }, [reduceMotion, sheenX, sweepEndX]);

  const sheenColors = isDark
    ? [
        'rgba(255,255,255,0)',
        'rgba(255,255,255,0.22)',
        'rgba(255,255,255,0.38)',
        'rgba(255,255,255,0.2)',
        'rgba(255,255,255,0)',
      ]
    : [
        'rgba(255,255,255,0)',
        'rgba(255,255,255,0.5)',
        'rgba(255,255,255,0.75)',
        'rgba(255,255,255,0.5)',
        'rgba(255,255,255,0)',
      ];

  return (
    <View className="mb-4">
      <View className="overflow-hidden rounded-xl">
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Complete questionnaire for better stylist matches"
          className={`flex-row items-center rounded-xl border-2 px-3 py-2.5 ${
            isDark ? 'border-textPrimary bg-[#132520]' : 'border-textPrimary bg-[#E8F5EF] shadow-sm'
          }`}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: SHEEN_WIDTH,
              zIndex: 0,
              transform: [{ translateX: sheenX }],
            }}
          >
            <LinearGradient
              colors={sheenColors}
              locations={[0, 0.25, 0.5, 0.75, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1, width: SHEEN_WIDTH, height: '100%' }}
            />
          </Animated.View>

          <View className="z-10 h-10 w-10 items-center justify-center rounded-full bg-textPrimary">
            <Ionicons name="clipboard" size={20} color="#FFFFFF" />
          </View>
          <View className="flex-1 ml-3 ">
            <Text
              className={` text-base font-urbanist-bold ${
                isDark ? 'text-textWhite' : 'text-textDark'
              }`}
            >
              Complete your questions
            </Text>
            <Text className="text-sm font-urbanist-regular text-textMuted">for better results</Text>
          </View>
          <Animated.View className="z-10" style={{ transform: [{ translateX: chevronNudge }] }}>
            <Ionicons name="chevron-forward" size={24} color="#27B07D" />
          </Animated.View>
        </TouchableOpacity>
      </View>
      <QuestionsModal visible={showQuestionsModal} onClose={() => setShowQuestionsModal(false)} />
    </View>
  );
};

export default CompleteQuestions;
