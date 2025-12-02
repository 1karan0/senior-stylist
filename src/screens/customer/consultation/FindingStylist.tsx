import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { customerConsultationsApi } from '@/api/customer/consultations';
import type { AppStackParamList, ConsultationStackParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { isDark } = useTheme();

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
      <View className={` justify-center items-center mb-4`}>
        <Image source={require('@/assets/icons/animation.png')} className="w-16 h-16" />
      </View>
      <Text className="text-[21px] font-semibold text-textDark text-center mb-2">
        Finding your Stylist...
      </Text>
      <Text className="text-[15px] text-textMuted text-center mb-5">
        We&apos;re matching you with the best stylist for your needs.
      </Text>

      <View className="w-full h-2 rounded bg-[#ECECEC] overflow-hidden mb-3">
        <View className="h-full rounded bg-buttonPrimaryBg" style={{ width: `${progress}%` }} />
      </View>
      <Text className="text-[13px] text-textMuted mb-5 text-center">
        {loading ? 'This usually takes just a few seconds.' : 'Hang tight, we are still looking...'}
      </Text>
    </>
  );

  const renderFailureState = () => (
    <>
      <View className="w-22 h-22 rounded-full bg-[#FEECEC] justify-center items-center mb-4">
        <Ionicons name="alert-circle" size={36} color="#E05959" />
      </View>
      <Text className="text-[21px] font-semibold text-textDark text-center mb-2">
        No stylists available right now
      </Text>
      <Text className="text-[15px] text-textMuted text-center mb-5">
        {searchFailedMessage ||
          'This is a very busy period for our stylists. Please try again in a few minutes.'}
      </Text>

      <TouchableOpacity
        className="mt-4 w-full rounded-xl bg-buttonPrimaryBg py-3.5 items-center"
        onPress={handleTryAgain}
      >
        <Text className="text-white text-[15px] font-bold">Try again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="mt-2.5 w-full rounded-xl border border-[#DAE7E0] py-3.5 items-center"
        onPress={handleViewConsultations}
      >
        <Text className="text-commonGradientStop6 text-[15px] font-semibold">
          View my consultations
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <LinearGradient colors={['#0E1B16', '#152821']} className="flex-1">
      <SafeAreaView className="flex-1 px-5">
        <TouchableOpacity
          className="w-10 h-10 rounded-full border border-white/20 justify-center items-center mb-4"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView contentContainerClassName="flex-grow justify-center" bounces={false}>
          <View className="bg-white rounded-[5px] p-6 items-center">
            {searchFailedMessage ? renderFailureState() : renderSearchingState()}

            {!searchFailedMessage && loading && (
              <View className="flex-row items-center gap-2 mt-3">
                <ActivityIndicator color="#27B07D" size="small" />
                <Text className="text-[13px] text-[#7C7C7C]">Connecting you with stylists…</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default FindingStylist;
