import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  BackHandler,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import Ionicons from '@react-native-vector-icons/ionicons';
import type { Ad } from '@/services/adService';

interface AdModalProps {
  visible: boolean;
  ad: Ad | null;
  onFinished: () => void;
  onClosedEarly?: () => void;
}

const AdModal: React.FC<AdModalProps> = ({ visible, ad, onFinished, onClosedEarly }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<any>(null);
  const elapsedSecondsRef = useRef(0);
  const AUTO_CLOSE_DURATION = 30; // Auto close after 30 seconds

  const handleClose = useCallback(() => {
    // Allow closing if canClose is true OR if 30 seconds have passed (for auto-close)
    const shouldAllowClose = canClose || elapsedSecondsRef.current >= AUTO_CLOSE_DURATION;

    if (!shouldAllowClose) {
      return;
    }

    // Clear timers first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    // Reset state
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    setCanClose(false);
    setVideoEnded(false);

    // Call onFinished to close modal
    onFinished();
  }, [canClose, onFinished]);

  // Reset state when ad changes or modal opens
  useEffect(() => {
    if (visible && ad) {
      setElapsedSeconds(0);
      setCanClose(false);
      setVideoEnded(false);
      setMediaError(null);

      // Log ad data for debugging
      if (__DEV__) {
        console.log('[AdModal] Ad data:', {
          id: ad.id,
          mediaType: ad.mediaType,
          mediaUrl: ad.mediaUrl?.substring(0, 50) + '...',
          segundosActivo: ad.segundosActivo,
        });
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          elapsedSecondsRef.current = next;
          const requiredSeconds = ad.segundosActivo;

          // Enable close button once required seconds have passed
          if (next >= requiredSeconds) {
            setCanClose(true);
          }

          return next;
        });
      }, 1000);

      // Auto-close after 30 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        // Force enable close if not already enabled
        setCanClose(true);
        // Close the modal
        handleClose();
      }, AUTO_CLOSE_DURATION * 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current);
          autoCloseTimerRef.current = null;
        }
      };
    } else {
      // Cleanup when modal closes
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      setElapsedSeconds(0);
      elapsedSecondsRef.current = 0;
      setCanClose(false);
      setVideoEnded(false);
      setMediaError(null);
    }
  }, [visible, ad, handleClose]);

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Only allow back if close button is enabled
      if (canClose) {
        handleClose();
        return true; // Prevent default back behavior
      }
      // Block back button if ad is still unskippable
      return true;
    });

    return () => backHandler.remove();
  }, [visible, canClose, handleClose]);

  // Check if we can close (either timer expired or video ended)
  useEffect(() => {
    if (!ad || !visible) return;

    const shouldEnableClose =
      elapsedSeconds >= ad.segundosActivo || (ad.mediaType === 'video' && videoEnded);

    if (shouldEnableClose) {
      setCanClose(true);
    }
  }, [elapsedSeconds, videoEnded, ad, visible]);

  const handleVideoEnd = useCallback(() => {
    setVideoEnded(true);
    // Video ended, enable close button
    setCanClose(true);
  }, []);

  const handleMediaPress = useCallback(() => {
    // If ad has redirect URL and close button is enabled, open it
    if (ad?.redirectUrl && canClose) {
      Linking.openURL(ad.redirectUrl).catch((err) => {
        console.error('[AdModal] Failed to open redirect URL:', err);
      });
    }
  }, [ad, canClose]);

  const handleImageError = useCallback((error: any) => {
    console.error('[AdModal] Image error:', error);
    setMediaError('Failed to load image');
    // Allow closing after timer expires even if image fails
  }, []);

  const handleVideoError = useCallback((error: any) => {
    console.error('[AdModal] Video error:', error);
    setMediaError('Failed to load video');
    // Allow closing after timer expires even if video fails
  }, []);

  if (!ad || !visible) {
    return null;
  }

  const renderMedia = () => {
    if (!ad.mediaUrl) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="image-outline" size={48} color="#FFFFFF" />
          <Text style={styles.errorText}>No media available</Text>
        </View>
      );
    }

    // Check if mediaUrl is a base64 data URI
    const isBase64 = ad.mediaUrl.startsWith('data:');
    const isVideoBase64 = isBase64 && ad.mediaUrl.startsWith('data:video/');

    // React Native Video doesn't support base64 data URIs
    if (ad.mediaType === 'video') {
      if (isVideoBase64) {
        // Video base64 is not supported - show error
        return (
          <View style={styles.errorContainer}>
            <Ionicons name="videocam-off-outline" size={48} color="#FFFFFF" />
            <Text style={styles.errorText}>Video format not supported</Text>
            <Text style={[styles.errorText, { fontSize: 12, marginTop: 4 }]}>
              Base64 videos are not supported
            </Text>
          </View>
        );
      }

      return (
        <Video
          ref={videoRef}
          source={{ uri: ad.mediaUrl }}
          style={styles.media}
          resizeMode="contain"
          paused={false}
          muted={false}
          repeat={false}
          onEnd={handleVideoEnd}
          onError={handleVideoError}
          onLoad={() => {
            if (__DEV__) console.log('[AdModal] Video loaded successfully');
            setMediaError(null);
          }}
          key={ad.id || ad.mediaUrl}
        />
      );
    } else {
      // Image - base64 should work
      return (
        <Image
          source={{ uri: ad.mediaUrl }}
          style={styles.media}
          resizeMode="contain"
          onError={handleImageError}
          onLoad={() => {
            if (__DEV__) console.log('[AdModal] Image loaded successfully');
            setMediaError(null);
          }}
          onLoadStart={() => {
            if (__DEV__) console.log('[AdModal] Image loading started');
          }}
          key={ad.id || ad.mediaUrl}
        />
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={canClose ? handleClose : undefined}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Close Button - Only visible when canClose is true */}
        {canClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Media Container */}
        <TouchableOpacity
          style={styles.mediaContainer}
          activeOpacity={ad.redirectUrl && canClose ? 0.9 : 1}
          onPress={handleMediaPress}
          disabled={!canClose || !ad.redirectUrl}
        >
          {renderMedia()}
          {mediaError && (
            <View style={styles.errorOverlay}>
              <Ionicons name="alert-circle-outline" size={32} color="#FFFFFF" />
              <Text style={styles.errorText}>{mediaError}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Optional: Show countdown or ad info (for debugging, can be removed) */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              {elapsedSeconds}s / {ad.segundosActivo}s
            </Text>
            {ad.mediaUrl && (
              <Text style={styles.debugText} numberOfLines={1}>
                Media: {ad.mediaUrl.substring(0, 30)}...
              </Text>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AdModal;
