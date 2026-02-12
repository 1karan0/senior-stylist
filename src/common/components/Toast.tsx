import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabletLayout } from '@/hooks/useTabletLayout';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const LIGHT_COLORS: Record<ToastType, { bg: string; text: string; border: string }> = {
  success: { bg: '#16a34a', text: '#ffffff', border: '#15803d' },
  error: { bg: '#dc2626', text: '#ffffff', border: '#b91c1c' },
  info: { bg: '#10b981', text: '#ffffff', border: '#059669' }, // Green theme
  warning: { bg: '#f59e0b', text: '#ffffff', border: '#d97706' },
};

const DARK_COLORS: Record<ToastType, { bg: string; text: string; border: string }> = {
  success: { bg: '#16a34a', text: '#ffffff', border: '#22c55e' },
  error: { bg: '#dc2626', text: '#ffffff', border: '#ef4444' },
  info: { bg: '#166534', text: '#ffffff', border: '#16a34a' }, // Dark green theme
  warning: { bg: '#f59e0b', text: '#ffffff', border: '#fbbf24' },
};

export default function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { horizontalPadding } = useTabletLayout();

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const hideTimer = useRef<number | null>(null);

  const colors = isDark ? DARK_COLORS[type] : LIGHT_COLORS[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        hideTimer.current = setTimeout(() => {
          handleClose();
        }, duration) as unknown as number;
      }
    } else {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    }

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  }

  if (!visible) return null;

  // Icon based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <View
      className="absolute left-4 right-4 z-[9999] items-center"
      pointerEvents="box-none"
      style={{ top: insets.top + 12, paddingHorizontal: horizontalPadding }}
    >
      <Animated.View
        style={{
          transform: [{ translateY }, { scale }],
          opacity,
          backgroundColor: colors.bg,
          borderColor: colors.border,
        }}
        className="w-full px-4 py-3.5 rounded-2xl flex-row items-center justify-between shadow-lg border-2"
      >
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="ml-2 w-6 h-6 items-center justify-center"
          >
            <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-3">
              <Text className="text-white text-lg font-bold">{getIcon()}</Text>
            </View>
          </TouchableOpacity>

          <Text
            className="flex-1 mr-2 font-medium"
            style={{ color: colors.text }}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
