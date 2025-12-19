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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<any>(null);

  // Reset state when ad changes or modal opens
  useEffect(() => {
    if (visible && ad) {
      setElapsedSeconds(0);
      setCanClose(false);
      setVideoEnded(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          const requiredSeconds = ad.segundosActivo;

          // Enable close button once required seconds have passed
          if (next >= requiredSeconds && !canClose) {
            setCanClose(true);
          }

          return next;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      // Cleanup when modal closes
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(0);
      setCanClose(false);
      setVideoEnded(false);
    }
  }, [visible, ad, canClose]);

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
  }, [visible, canClose]);

  // Check if we can close (either timer expired or video ended)
  useEffect(() => {
    if (!ad) return;

    const shouldEnableClose =
      elapsedSeconds >= ad.segundosActivo || (ad.mediaType === 'video' && videoEnded);

    if (shouldEnableClose && !canClose) {
      setCanClose(true);
    }
  }, [elapsedSeconds, videoEnded, ad, canClose]);

  const handleClose = useCallback(() => {
    if (!canClose) return;

    // Stop video if playing
    if (ad?.mediaType === 'video' && videoRef.current) {
      // Video component will handle cleanup
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    onFinished();
  }, [canClose, ad, onFinished]);

  const handleVideoEnd = useCallback(() => {
    setVideoEnded(true);
    // If timer has also expired, we can close
    if (ad && elapsedSeconds >= ad.segundosActivo) {
      setCanClose(true);
    }
  }, [ad, elapsedSeconds]);

  const handleMediaPress = useCallback(() => {
    // If ad has redirect URL and close button is enabled, open it
    if (ad?.redirectUrl && canClose) {
      Linking.openURL(ad.redirectUrl).catch((err) => {
        console.error('[AdModal] Failed to open redirect URL:', err);
      });
    }
  }, [ad, canClose]);

  if (!ad || !visible) {
    return null;
  }

  const renderMedia = () => {
    if (ad.mediaType === 'video') {
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
          onError={(error) => {
            console.error('[AdModal] Video error:', error);
            // If video fails, allow closing after timer
          }}
        />
      );
    } else {
      return <Image source={{ uri: ad.mediaUrl }} style={styles.media} resizeMode="contain" />;
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
        </TouchableOpacity>

        {/* Optional: Show countdown or ad info (for debugging, can be removed) */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              {elapsedSeconds}s / {ad.segundosActivo}s | Can close: {canClose ? 'Yes' : 'No'}
            </Text>
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
  },
  media: {
    width: '100%',
    height: '100%',
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
});

export default AdModal;
