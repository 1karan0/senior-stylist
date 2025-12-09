import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createConsultation } from '@/api/user/consultation/useCreateConsultation';
import { customerConsultationsApi } from '@/api/customer/consultations';
import type { AppStackParamList, ConsultationStackParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import { storage } from '@/services/storage';

type CombinedStackParamList = AppStackParamList & ConsultationStackParamList;
type FindingRoute = RouteProp<CombinedStackParamList, 'FindingStylist'>;

const STATUS_POLL_INTERVAL = 3000;
const PROGRESS_INTERVAL = 500;

const FindingStylist: React.FC = () => {
  const route = useRoute<FindingRoute>();
  const navigation = useNavigation<any>();
  const consultationId = route.params?.consultationId;

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [searchFailedMessage, setSearchFailedMessage] = useState<string | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error' as any,
  });

  const { isDark } = useTheme();

  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

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
    if (!consultationId || !Number.isFinite(consultationId)) {
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

  // handleTryAgain: stop timers, load saved draft, and re-run the same submission flow
  const handleTryAgain = async () => {
    stopAllTimers();

    setLoading(true);
    try {
      const draft = await storage.getConsultationDraft();

      if (!draft) {
        showToast('No saved consultation to retry. Please enter details again.', 'warning');
        navigation.replace('NewConsultant');
        return;
      }

      // Validate draft shape
      if (!draft.description || !draft.description.trim()) {
        // corrupted or incomplete draft — clear and ask user to re-enter
        await storage.removeConsultationDraft();
        showToast('Saved consultation is incomplete. Please re-enter your details.', 'error');
        navigation.replace('NewConsultant');
        return;
      }

      // Use draft.selectedImage if present; fallback to current selectedImage (if your component keeps it)
      // Only use image if it exists in the draft
      const imageToUse = draft.selectedImage ? draft.selectedImage : null;

      // Re-run the createConsultation call (same shape as onSubmit)
      const response = await createConsultation(draft.description, imageToUse);

      const newId =
        response?.data?.consultation?.id ??
        response?.consultation?.id ??
        response?.data?.id ??
        response?.id;

      if (!newId) {
        showToast('Retry failed to open chat automatically. Please try again.', 'warning');
        // keep draft for further retries
        return;
      }

      // Success: clear draft and navigate
      await storage.removeConsultationDraft();
      navigation.replace('FindingStylist', { consultationId: Number(newId) });
    } catch (err: any) {
      showToast(err?.message || 'Retry failed. Please try again.', 'error');
      // keep draft so user can retry again
    } finally {
      setLoading(false);
    }
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

  // Early return if consultationId is missing
  if (!consultationId || !Number.isFinite(consultationId)) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#0E1B16' }}>
        <SafeAreaView className="flex-1 px-5 justify-center items-center">
          <Text className="text-white text-lg mb-4">Invalid consultation reference</Text>
          <TouchableOpacity
            className="rounded-xl bg-buttonPrimaryBg py-3.5 px-6"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white text-[15px] font-bold">Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#0E1B16' }}>
      <SafeAreaView className="flex-1 px-5">
        <TouchableOpacity
          className="w-10 h-10 rounded-full border border-white/20 justify-center items-center mt-4"
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
    </View>
  );
};

export default FindingStylist;
