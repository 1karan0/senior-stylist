import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const COLORS: Record<ToastType, string> = {
  success: '#16a34a',
  error: '#dc2626',
  info: '#2563eb',
  warning: '#f59e0b',
};

export default function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      if (duration > 0) {
        hideTimer.current = setTimeout(() => {
          handleClose();
        }, duration) as unknown as number;
      }
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -40, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

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
      Animated.timing(translateY, { toValue: -40, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onClose?.();
    });
  }

  if (!visible) return null;

  return (
    <View
      className="absolute left-4 right-4 z-[9999] items-center"
      pointerEvents="auto"
      style={{ top: insets.top + 16 }}
    >
      <Animated.View
        style={{ transform: [{ translateY }], opacity, backgroundColor: COLORS[type] }}
        className="w-full px-4 py-3 rounded-xl flex-row items-center justify-between shadow-md"
      >
        <Text className="text-white flex-1 mr-2">{message}</Text>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-white text-lg opacity-90">✕</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
