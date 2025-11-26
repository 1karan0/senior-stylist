import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { customerConsultationsApi } from '@/api/customer/consultations';
import type { AppStackParamList, ConsultationStackParamList } from '@/common/types';

type CombinedStackParamList = AppStackParamList & ConsultationStackParamList;
type FindingRoute = RouteProp<CombinedStackParamList, 'FindingStylist'>;

const STATUS_POLL_INTERVAL = 3000;
const PROGRESS_INTERVAL = 500;

const FindingStylist: React.FC = () => {
  const route = useRoute<FindingRoute>();
  const navigation = useNavigation<any>();
  const { consultationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [searchFailedMessage, setSearchFailedMessage] = useState<string | null>(null);

  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAllTimers = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handleSearchFailure = useCallback(
    (message?: string) => {
      stopAllTimers();
      setSearchFailedMessage(
        message || 'This is a very busy period for our stylists. Please try again in a few minutes.'
      );
    },
    [stopAllTimers]
  );

  const navigateToChat = useCallback(() => {
    stopAllTimers();

    // Reset the inner Consultation stack so that when the user comes back
    // from the chat screen, they land on the consultations list, not on this
    // transient "Finding stylist" screen.
    navigation.reset({
      index: 0,
      routes: [{ name: 'ConsultationHome' as never }],
    });

    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('ConsultantChat', { consultationId, asCustomer: true });
    } else {
      navigation.navigate('ConsultantChat', { consultationId, asCustomer: true });
    }
  }, [consultationId, navigation, stopAllTimers]);

  const checkConsultationStatus = useCallback(async () => {
    if (!Number.isFinite(consultationId)) {
      handleSearchFailure('Invalid consultation reference.');
      return;
    }

    try {
      const response = await customerConsultationsApi.get(consultationId);
      if (response.status === 'success' && response.data?.consultation) {
        const updated = response.data.consultation;

        if (
          (updated.status === 'assigned' && updated.consultant_id) ||
          updated.status === 'active'
        ) {
          navigateToChat();
          return;
        }

        if (updated.status === 'cancelled' || updated.status === 'expired') {
          handleSearchFailure();
          return;
        }
      }
    } catch {
      // transient error, next poll will retry
    } finally {
      setLoading(false);
    }
  }, [consultationId, handleSearchFailure, navigateToChat]);

  useEffect(() => {
    checkConsultationStatus();
    statusIntervalRef.current = setInterval(checkConsultationStatus, STATUS_POLL_INTERVAL);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + 2;
      });
    }, PROGRESS_INTERVAL);

    return () => {
      stopAllTimers();
    };
  }, [checkConsultationStatus, stopAllTimers]);

  const handleTryAgain = () => {
    stopAllTimers();
    navigation.replace('NewConsultant');
  };

  const handleViewConsultations = () => {
    stopAllTimers();
    navigation.reset({
      index: 0,
      routes: [{ name: 'ConsultationHome' as keyof CombinedStackParamList }],
    });
  };

  const renderSearchingState = () => (
    <>
      <View style={styles.iconCircle}>
        <Ionicons name="sparkles" size={36} color="#27B07D" />
      </View>
      <Text style={styles.title}>Finding your Stylist...</Text>
      <Text style={styles.subtitle}>
        We&apos;re matching you with the best stylist for your needs.
      </Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressCaption}>
        {loading ? 'This usually takes just a few seconds.' : 'Hang tight, we are still looking...'}
      </Text>
    </>
  );

  const renderFailureState = () => (
    <>
      <View style={[styles.iconCircle, styles.failureCircle]}>
        <Ionicons name="alert-circle" size={36} color="#E05959" />
      </View>
      <Text style={styles.title}>No stylists available right now</Text>
      <Text style={styles.subtitle}>
        {searchFailedMessage ||
          'This is a very busy period for our stylists. Please try again in a few minutes.'}
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleTryAgain}>
        <Text style={styles.primaryButtonText}>Try again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleViewConsultations}>
        <Text style={styles.secondaryButtonText}>View my consultations</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <LinearGradient colors={['#0E1B16', '#152821']} style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.card}>
            {searchFailedMessage ? renderFailureState() : renderSearchingState()}

            {!searchFailedMessage && loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#27B07D" size="small" />
                <Text style={styles.loadingText}>Connecting you with stylists…</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8FFF3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  failureCircle: {
    backgroundColor: '#FEECEC',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0E1B16',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#5C5C5C',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ECECEC',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#27B07D',
  },
  progressCaption: {
    fontSize: 13,
    color: '#7C7C7C',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#7C7C7C',
  },
  primaryButton: {
    marginTop: 16,
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#27B07D',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0E1B16',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DAE7E0',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0E1B16',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default FindingStylist;
