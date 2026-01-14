import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { createConsultation } from '@/api/user/consultation/useCreateConsultation';
import { useCancelConsultaion } from '@/api/user/consultation/useCancelConsultaion';
import { customerConsultationsApi } from '@/api/customer/consultations';
import Toast from '@/common/components/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { storage } from '@/services/storage';
import { useAds } from '@/contexts/AdContext';
import AdModal from '@/common/components/modals/AdModal';
import type { ConsultantConsultation } from '@/api/consultant/consultations';
import CancelConsultationModal from '@/common/components/modals/CancelConsultationModal';
import { ModalWrapper } from '@/common/components/ModalWrapper';
import { useFindingStylistModal } from '@/contexts/FindingStylistModalContext';

const STATUS_POLL_INTERVAL = 3000;
const PROGRESS_INTERVAL = 500;
const INITIAL_AD_DELAY = 2500; // 2.5 seconds before showing first ad
const FOLLOW_UP_AD_DELAY = 3000; // 3 seconds delay before showing follow-up ad

const FindingStylistModal: React.FC = () => {
  const navigation = useNavigation<any>();
  const { visible, consultationId, close, setConsultationId } = useFindingStylistModal();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [searchFailedMessage, setSearchFailedMessage] = useState<string | null>(null);
  const [consultationStatus, setConsultationStatus] = useState<string | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error' as any,
  });

  // Ad-related state
  const [currentAd, setCurrentAd] = useState<any>(null);
  const [showAd, setShowAd] = useState(false);
  const [showStylistProfile, setShowStylistProfile] = useState(false);
  const [acceptedConsultation, setAcceptedConsultation] = useState<ConsultantConsultation | null>(
    null
  );
  const [hasShownInitialAd, setHasShownInitialAd] = useState(false);
  const [isWaitingForAd2, setIsWaitingForAd2] = useState(false);
  const [adLoopActive, setAdLoopActive] = useState(false); // Track if ad loop is active
  const [showCancelModal, setShowCancelModal] = useState(false); // Modal for cancel consultation

  const { isDark } = useTheme();
  const cancelConsultationMutation = useCancelConsultaion();
  const { isAdsEnabled, preloadAd, getAndConsumeAd } = useAds();

  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialAdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextAdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showStylistProfileRef = useRef(false);
  const adLoopActiveRef = useRef(false);

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
    if (initialAdTimerRef.current) {
      clearTimeout(initialAdTimerRef.current);
      initialAdTimerRef.current = null;
    }
    if (nextAdTimerRef.current) {
      clearTimeout(nextAdTimerRef.current);
      nextAdTimerRef.current = null;
    }
  }, []);

  const closeAllAndDismiss = useCallback(() => {
    stopAllTimers();
    setShowAd(false);
    setCurrentAd(null);
    setAdLoopActive(false);
    adLoopActiveRef.current = false;
    close();
  }, [close, stopAllTimers]);

  const findNavigatorWithRoute = useCallback(
    (routeName: string) => {
      let current: any = navigation;
      for (let i = 0; i < 10; i++) {
        const state = current?.getState?.();
        if (state?.routeNames?.includes?.(routeName)) {
          return current;
        }
        const parent = current?.getParent?.();
        if (!parent) break;
        current = parent;
      }
      return navigation;
    },
    [navigation]
  );

  const navigateToChat = useCallback(() => {
    if (!consultationId) return;
    stopAllTimers();
    close();

    const nav = findNavigatorWithRoute('ConsultantChat');
    nav.navigate('ConsultantChat', { consultationId, asCustomer: true });
  }, [consultationId, stopAllTimers, close, findNavigatorWithRoute]);

  // Handle Ad #1 (initial search ad) - starts the ad loop
  const showInitialAd = useCallback(async () => {
    if (hasShownInitialAd || !isAdsEnabled) return;
    await preloadAd('small');
    const ad = getAndConsumeAd('small');
    if (ad) {
      setCurrentAd(ad);
      setShowAd(true);
      setHasShownInitialAd(true);
      setAdLoopActive(true);
      adLoopActiveRef.current = true;
    }
  }, [hasShownInitialAd, isAdsEnabled, preloadAd, getAndConsumeAd]);

  // Handle Ad #2 (when user clicks "Go to Chat" button)
  const showSecondAd = useCallback(async () => {
    setShowStylistProfile(false);

    if (!isAdsEnabled) {
      navigateToChat();
      return;
    }

    await preloadAd('small');
    const ad = getAndConsumeAd('small');
    if (ad) {
      setCurrentAd(ad);
      setShowAd(true);
      setIsWaitingForAd2(true);
    } else {
      navigateToChat();
    }
  }, [isAdsEnabled, preloadAd, getAndConsumeAd, navigateToChat]);

  // Keep refs in sync with state
  useEffect(() => {
    showStylistProfileRef.current = showStylistProfile;
    adLoopActiveRef.current = adLoopActive;
  }, [showStylistProfile, adLoopActive]);

  const handleSearchFailure = useCallback(
    (message?: string) => {
      stopAllTimers();
      setSearchFailedMessage(
        message || 'This is a very busy period for our stylists. Please try again in a few minutes.'
      );
      setAdLoopActive(false);
      adLoopActiveRef.current = false;
      setShowAd(false);
      setCurrentAd(null);
    },
    [stopAllTimers]
  );

  // Show next ad in the loop (after 3 second break)
  const showNextAd = useCallback(async () => {
    if (
      showStylistProfileRef.current ||
      !isAdsEnabled ||
      searchFailedMessage !== null ||
      !adLoopActiveRef.current
    ) {
      return;
    }

    await preloadAd('small');
    const ad = getAndConsumeAd('small');
    if (ad) {
      setCurrentAd(ad);
      setShowAd(true);
    }
  }, [isAdsEnabled, searchFailedMessage, preloadAd, getAndConsumeAd]);

  const handleAdFinished = useCallback(() => {
    setShowAd(false);
    setCurrentAd(null);

    if (isWaitingForAd2) {
      setIsWaitingForAd2(false);
      navigateToChat();
      return;
    }

    if (adLoopActiveRef.current && !showStylistProfileRef.current && searchFailedMessage === null) {
      if (nextAdTimerRef.current) clearTimeout(nextAdTimerRef.current);
      nextAdTimerRef.current = setTimeout(() => {
        if (
          adLoopActiveRef.current &&
          !showStylistProfileRef.current &&
          searchFailedMessage === null
        ) {
          showNextAd();
        }
      }, FOLLOW_UP_AD_DELAY);
    }
  }, [isWaitingForAd2, navigateToChat, showNextAd, searchFailedMessage]);

  const checkConsultationStatus = useCallback(async () => {
    if (!consultationId || !Number.isFinite(consultationId)) {
      handleSearchFailure('Invalid consultation reference.');
      return;
    }

    try {
      const response = await customerConsultationsApi.get(consultationId);
      if (response.status === 'success' && response.data?.consultation) {
        const updated = response.data.consultation;
        setConsultationStatus(updated.status);

        if (
          (updated.status === 'assigned' && updated.consultant_id) ||
          updated.status === 'active'
        ) {
          if (!showStylistProfile && !isWaitingForAd2) {
            setAcceptedConsultation(updated);
            setShowStylistProfile(true);
            showStylistProfileRef.current = true;
            stopAllTimers();

            setAdLoopActive(false);
            adLoopActiveRef.current = false;

            setShowAd(false);
            setCurrentAd(null);

            if (nextAdTimerRef.current) {
              clearTimeout(nextAdTimerRef.current);
              nextAdTimerRef.current = null;
            }
          }
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
  }, [consultationId, handleSearchFailure, showStylistProfile, isWaitingForAd2, stopAllTimers]);

  // Reset modal state when opened / consultationId changes
  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    setProgress(0);
    setSearchFailedMessage(null);
    setConsultationStatus(null);
    setShowStylistProfile(false);
    setAcceptedConsultation(null);
    setHasShownInitialAd(false);
    setIsWaitingForAd2(false);
    setAdLoopActive(false);
    adLoopActiveRef.current = false;
    setShowAd(false);
    setCurrentAd(null);

    return () => {
      stopAllTimers();
    };
  }, [visible, consultationId, stopAllTimers]);

  useEffect(() => {
    if (!visible) return;
    if (!consultationId || !Number.isFinite(consultationId)) return;

    checkConsultationStatus();
    statusIntervalRef.current = setInterval(checkConsultationStatus, STATUS_POLL_INTERVAL);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? prev : prev + 2));
    }, PROGRESS_INTERVAL);

    if (isAdsEnabled && !hasShownInitialAd) {
      initialAdTimerRef.current = setTimeout(() => {
        showInitialAd();
      }, INITIAL_AD_DELAY);
    }

    return () => stopAllTimers();
  }, [
    visible,
    consultationId,
    checkConsultationStatus,
    stopAllTimers,
    isAdsEnabled,
    hasShownInitialAd,
    showInitialAd,
  ]);

  const handleTryAgain = async () => {
    stopAllTimers();
    setLoading(true);
    try {
      const draft = await storage.getConsultationDraft();
      if (!draft) {
        showToast('No saved consultation to retry. Please enter details again.', 'warning');
        closeAllAndDismiss();
        return;
      }

      if (!draft.description || !draft.description.trim()) {
        await storage.removeConsultationDraft();
        showToast('Saved consultation is incomplete. Please re-enter your details.', 'error');
        closeAllAndDismiss();
        return;
      }

      const imageToUse = draft.selectedImage ? draft.selectedImage : null;
      const response = await createConsultation(draft.description, imageToUse);
      const newId =
        response?.data?.consultation?.id ??
        response?.consultation?.id ??
        response?.data?.id ??
        response?.id;

      if (!newId || !Number.isFinite(Number(newId))) {
        showToast('Retry failed to open chat automatically. Please try again.', 'warning');
        return;
      }

      await storage.removeConsultationDraft();
      setConsultationId(Number(newId));
    } catch (err: any) {
      showToast(err?.message || 'Retry failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConsultation = useCallback(async () => {
    if (!consultationId) {
      showToast('Invalid consultation reference.', 'error');
      return;
    }

    if (consultationStatus === 'assigned' || consultationStatus === 'active') {
      showToast('This consultation has already been accepted and cannot be cancelled.', 'warning');
      return;
    }

    try {
      stopAllTimers();
      setLoading(true);
      await cancelConsultationMutation.mutateAsync(String(consultationId));
      showToast('Consultation cancelled successfully.', 'success');
      await storage.removeConsultationDraft();
      closeAllAndDismiss();
    } catch (err: any) {
      showToast(err?.message || 'Failed to cancel consultation. Please try again.', 'error');
      setLoading(false);
    }
  }, [
    consultationId,
    consultationStatus,
    cancelConsultationMutation,
    closeAllAndDismiss,
    stopAllTimers,
  ]);

  const canCancelConsultation =
    consultationStatus &&
    consultationStatus !== 'assigned' &&
    consultationStatus !== 'active' &&
    consultationStatus !== 'cancelled' &&
    consultationStatus !== 'expired';

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

  const renderStylistProfile = () => {
    if (!acceptedConsultation?.consultant) return null;

    const consultant = acceptedConsultation.consultant;
    const consultantDetails = consultant.consultant_details as
      | {
          specialization?: string;
          bio?: string;
          years_experience?: number;
          average_rating?: string | number;
          total_sessions?: number;
        }
      | null
      | undefined;

    const specialization = consultantDetails?.specialization;
    const bio = consultantDetails?.bio;
    const yearsExperience = consultantDetails?.years_experience;
    const averageRating = consultantDetails?.average_rating;

    const formattedRating =
      averageRating && parseFloat(String(averageRating)) > 0
        ? typeof averageRating === 'number'
          ? averageRating.toFixed(1)
          : parseFloat(String(averageRating)).toFixed(1)
        : null;

    return (
      <>
        <View className="justify-center items-center mb-4">
          {consultant.profile_picture_url ? (
            <Image
              source={{ uri: consultant.profile_picture_url }}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-buttonPrimaryBg justify-center items-center">
              <Text className="text-white text-2xl font-bold">
                {consultant.name?.charAt(0)?.toUpperCase() || 'S'}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-[21px] font-semibold text-textDark text-center mb-2">
          {consultant.name}
        </Text>
        {specialization && (
          <Text className="text-[15px] text-textMuted text-center mb-2">{specialization}</Text>
        )}
        {formattedRating && (
          <View className="flex-row items-center justify-center mb-2">
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text className="text-[14px] ml-1 font-medium text-textDark">{formattedRating}</Text>
          </View>
        )}
        {yearsExperience && (
          <Text className="text-[13px] text-textMuted text-center mb-4">
            {yearsExperience} years of experience
          </Text>
        )}
        {bio && <Text className="text-[14px] text-textMuted text-center mb-5 px-4">{bio}</Text>}
        <TouchableOpacity
          className="mt-4 w-full rounded-xl bg-buttonPrimaryBg py-3.5 items-center"
          onPress={showSecondAd}
        >
          <Text className="text-white text-[15px] font-bold">Go to Chat</Text>
        </TouchableOpacity>
      </>
    );
  };

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
        onPress={closeAllAndDismiss}
      >
        <Text className="text-commonGradientStop6 text-[15px] font-semibold">Close</Text>
      </TouchableOpacity>
    </>
  );

  if (!visible) return null;

  return (
    <>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <ModalWrapper
        visible={visible}
        onClose={() => {
          // While searching, don't allow dismiss — show cancel modal instead.
          if (!searchFailedMessage && !showStylistProfile) {
            setShowCancelModal(true);
            return;
          }
          closeAllAndDismiss();
        }}
        dismissOnBackdropPress={false}
        containerClassName={isDark ? 'bg-buttonSecondaryText' : 'bg-white'}
      >
        <ScrollView contentContainerClassName="items-center" bounces={false}>
          <View className="w-full items-center">
            {showStylistProfile
              ? renderStylistProfile()
              : searchFailedMessage
                ? renderFailureState()
                : renderSearchingState()}

            {!searchFailedMessage && loading && (
              <View className="flex-row items-center gap-2 mt-3">
                <ActivityIndicator color="#27B07D" size="small" />
                <Text className="text-[13px] text-[#7C7C7C]">Connecting you with stylists…</Text>
              </View>
            )}

            {!searchFailedMessage && canCancelConsultation && (
              <TouchableOpacity
                className="mt-4 w-full rounded-xl border border-red-300 py-3.5 items-center"
                onPress={handleCancelConsultation}
                disabled={cancelConsultationMutation.isPending || loading}
              >
                <Text className="text-red-500 text-[15px] font-semibold">
                  {cancelConsultationMutation.isPending ? 'Cancelling...' : 'Cancel Consultation'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </ModalWrapper>

      <AdModal visible={showAd} ad={currentAd} onFinished={handleAdFinished} />

      <CancelConsultationModal
        visible={showCancelModal}
        onConfirm={() => {
          setShowCancelModal(false);
          handleCancelConsultation();
        }}
        onCancel={() => {
          setShowCancelModal(false);
        }}
        isLoading={cancelConsultationMutation.isPending}
      />
    </>
  );
};

export default FindingStylistModal;
