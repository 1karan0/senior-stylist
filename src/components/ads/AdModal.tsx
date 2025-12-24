import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  Platform,
  BackHandler,
  Linking,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import Ionicons from '@react-native-vector-icons/ionicons';
import Svg, { Circle } from 'react-native-svg';
import type { Ad } from '@/services/adService';

interface AdModalProps {
  visible: boolean;
  ad: Ad | null;
  onFinished: () => void;
  onClosedEarly?: () => void;
}

const AUTO_CLOSE_DURATION = 30;

const AdModal: React.FC<AdModalProps> = ({ visible, ad, onFinished }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<any>(null);
  const elapsedSecondsRef = useRef(0);
  const adIdRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    setCanClose(false);
    setVideoEnded(false);
    setMediaError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (!canClose && elapsedSecondsRef.current < AUTO_CLOSE_DURATION) return;
    clearTimers();
    resetState();
    onFinished();
  }, [canClose, clearTimers, resetState, onFinished]);

  // Timer and ad lifecycle
  useEffect(() => {
    if (!visible || !ad) {
      clearTimers();
      resetState();
      adIdRef.current = null;
      return;
    }

    const isNewAd = adIdRef.current !== ad.id;
    if (isNewAd) {
      clearTimers();
      resetState();
      adIdRef.current = ad.id;

      if (__DEV__) {
        console.log('[AdModal] Ad data:', {
          id: ad.id,
          mediaType: ad.mediaType,
          mediaUrl: ad.mediaUrl?.substring(0, 50) + '...',
          segundosActivo: ad.segundosActivo,
        });
      }

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          elapsedSecondsRef.current = next;
          if (next >= ad.segundosActivo) setCanClose(true);
          return next;
        });
      }, 1000);

      autoCloseTimerRef.current = setTimeout(() => {
        setCanClose(true);
        handleClose();
      }, AUTO_CLOSE_DURATION * 1000);
    }

    return () => {
      if (!visible || adIdRef.current !== ad.id) clearTimers();
    };
  }, [visible, ad, clearTimers, resetState, handleClose]);

  // Back handler
  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canClose) handleClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, canClose, handleClose]);

  // Auto-enable close
  useEffect(() => {
    if (!ad || !visible) return;
    if (elapsedSeconds >= ad.segundosActivo || (ad.mediaType === 'video' && videoEnded)) {
      setCanClose(true);
    }
  }, [elapsedSeconds, videoEnded, ad, visible]);

  // Fade animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: canClose ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [canClose, fadeAnim]);

  const handleVideoEnd = useCallback(() => {
    setVideoEnded(true);
    setCanClose(true);
  }, []);

  const handleMediaPress = useCallback(() => {
    if (ad?.redirectUrl && canClose) {
      Linking.openURL(ad.redirectUrl).catch((err) =>
        console.error('[AdModal] Failed to open redirect URL:', err)
      );
    }
  }, [ad, canClose]);

  if (!ad || !visible) return null;

  const progressPercentage = Math.min((elapsedSeconds / ad.segundosActivo) * 100, 100);
  const remainingSeconds = Math.max(ad.segundosActivo - elapsedSeconds, 0);
  const topOffset = Platform.OS === 'ios' ? 60 : 50;

  const renderMedia = () => {
    if (!ad.mediaUrl) {
      return (
        <View className="flex-1 justify-center items-center bg-[#0a0a0a]">
          <Ionicons name="image-outline" size={64} color="#666666" />
          <Text className="text-gray-400 text-base mt-4 text-center">No media available</Text>
        </View>
      );
    }

    if (ad.mediaType === 'video') {
      return (
        <Video
          ref={videoRef}
          source={{ uri: ad.mediaUrl }}
          style={{ flex: 1, width: '100%', height: '100%', backgroundColor: 'transparent' }}
          resizeMode="contain"
          paused={false}
          muted={false}
          repeat={false}
          onEnd={handleVideoEnd}
          onError={() => setMediaError('Failed to load video')}
          onLoad={() => setMediaError(null)}
          key={ad.id}
        />
      );
    }

    return (
      <Image
        source={{ uri: ad.mediaUrl }}
        style={{ flex: 1, width: '100%', height: '100%', backgroundColor: 'transparent' }}
        resizeMode="contain"
        onError={() => setMediaError('Failed to load image')}
      />
    );
  };

  const renderTimerIndicator = () => {
    if (!ad || canClose) return null;

    const size = 28;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

    return (
      <View className="absolute z-20" style={{ top: topOffset, right: 20 }}>
        <View
          className="items-center justify-center rounded-full shadow-lg"
          style={{ width: size, height: size, backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        >
          <Svg
            width={size}
            height={size}
            style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
          >
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#00ff88"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
          <Text className="text-white text-lg font-bold">{remainingSeconds}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={canClose ? handleClose : undefined}
      statusBarTranslucent
    >
      <SafeAreaView
        className="flex-1 bg-black justify-center items-center"
        edges={['top', 'bottom']}
      >
        {renderTimerIndicator()}

        {canClose && (
          <Animated.View
            style={{
              position: 'absolute',
              top: topOffset,
              right: 20,
              zIndex: 20,
              opacity: fadeAnim,
            }}
          >
            <TouchableOpacity
              className="shadow-lg"
              style={{
                width: 28,
                height: 28,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {ad.redirectUrl && canClose && (
          <View
            className="absolute z-10"
            style={{ bottom: Platform.OS === 'ios' ? 100 : 80, alignSelf: 'center' }}
          >
            <View
              className="px-6 py-3 rounded-full shadow-lg"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            >
              <Text className="text-white text-sm font-medium">Tap to learn more</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          className="w-full h-full bg-[#0a0a0a]"
          style={{ position: 'relative' }}
          activeOpacity={ad.redirectUrl && canClose ? 0.95 : 1}
          onPress={handleMediaPress}
          disabled={!canClose || !ad.redirectUrl}
        >
          {renderMedia()}
          {mediaError && (
            <View
              className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
            >
              <Ionicons name="alert-circle-outline" size={64} color="#ff4444" />
              <Text className="text-white text-base mt-4 text-center px-8">{mediaError}</Text>
              <Text className="text-gray-400 text-sm mt-2 text-center px-8">
                The ad will close automatically
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View
          className="absolute z-10"
          style={{ bottom: Platform.OS === 'ios' ? 50 : 30, alignSelf: 'center' }}
        >
          <View
            className="px-4 py-2 rounded-full"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <Text className="text-gray-300 text-xs">Advertisement</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default AdModal;
