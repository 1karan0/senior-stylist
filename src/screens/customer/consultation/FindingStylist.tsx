import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createConsultation } from '@/api/user/consultation/useCreateConsultation';
import { useCancelConsultaion } from '@/api/user/consultation/useCancelConsultaion';
import { customerConsultationsApi } from '@/api/customer/consultations';
import type { AppStackParamList, ConsultationStackParamList } from '@/common/types';
import Toast from '@/common/components/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { storage } from '@/services/storage';
import { useAds } from '@/contexts/AdContext';
import AdModal from '@/components/ads/AdModal';
import type { ConsultantConsultation } from '@/api/consultant/consultations';

type CombinedStackParamList = AppStackParamList & ConsultationStackParamList;
type FindingRoute = RouteProp<CombinedStackParamList, 'FindingStylist'>;

const STATUS_POLL_INTERVAL = 3000;
const PROGRESS_INTERVAL = 500;
const INITIAL_AD_DELAY = 2500; // 2.5 seconds before showing first ad
const FOLLOW_UP_AD_DELAY = 3000; // 3 seconds delay before showing follow-up ad

const FindingStylist: React.FC = () => {
  const route = useRoute<FindingRoute>();
  const navigation = useNavigation<any>();
  const consultationId = route.params?.consultationId;

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

  const { isDark } = useTheme();
  const cancelConsultationMutation = useCancelConsultaion();
  const { isAdsEnabled, preloadAd, getAndConsumeAd } = useAds();

  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialAdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (profileTimerRef.current) {
      clearTimeout(profileTimerRef.current);
      profileTimerRef.current = null;
    }
    if (nextAdTimerRef.current) {
      clearTimeout(nextAdTimerRef.current);
      nextAdTimerRef.current = null;
    }
  }, []);

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

  // Handle Ad #1 (initial search ad) - starts the ad loop
  const showInitialAd = useCallback(async () => {
    if (hasShownInitialAd || !isAdsEnabled) return;

    // Preload if not already loaded
    await preloadAd('small');

    // Get and show the ad
    const ad = getAndConsumeAd('small');
    if (ad) {
      setCurrentAd(ad);
      setShowAd(true);
      setHasShownInitialAd(true);
      // Start the ad loop
      setAdLoopActive(true);
      adLoopActiveRef.current = true;
    }
  }, [hasShownInitialAd, isAdsEnabled, preloadAd, getAndConsumeAd]);

  // Handle Ad #2 (when user clicks "Go to Chat" button)
  const showSecondAd = useCallback(async () => {
    // Hide profile first
    setShowStylistProfile(false);

    if (!isAdsEnabled) {
      // If ads disabled, go straight to chat
      navigateToChat();
      return;
    }

    // Preload if not already loaded
    await preloadAd('small');

    // Get and show the ad
    const ad = getAndConsumeAd('small');
    if (ad) {
      setCurrentAd(ad);
      setShowAd(true);
      setIsWaitingForAd2(true);
    } else {
      // No ad available, go to chat
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
      // Stop ad loop when search fails - no ads at try again stage
      setAdLoopActive(false);
      adLoopActiveRef.current = false;
      setShowAd(false);
      setCurrentAd(null);
    },
    [stopAllTimers]
  );

  // Show next ad in the loop (after 3 second break)
  const showNextAd = useCallback(async () => {
    // Don't show if:
    // - Consultation is already selected
    // - Ads are disabled
    // - Search has failed (try again stage)
    // - Ad loop is not active
    if (
      showStylistProfileRef.current ||
      !isAdsEnabled ||
      searchFailedMessage !== null ||
      !adLoopActiveRef.current
    ) {
      return;
    }

    // Preload if not already loaded
    await preloadAd('small');

    // Get and show the ad
    const ad = getAndConsumeAd('small');
    if (ad) {
      setCurrentAd(ad);
      setShowAd(true);
    }
  }, [isAdsEnabled, searchFailedMessage, preloadAd, getAndConsumeAd]);

  // Handle ad finished
  const handleAdFinished = useCallback(() => {
    setShowAd(false);
    setCurrentAd(null);

    if (isWaitingForAd2) {
      // Ad #2 finished (after clicking Go to Chat), navigate to chat
      setIsWaitingForAd2(false);
      navigateToChat();
      return;
    }

    // For loop ads: If consultation not selected and search hasn't failed, schedule next ad after 3 seconds
    if (adLoopActiveRef.current && !showStylistProfileRef.current && searchFailedMessage === null) {
      // Clear any existing next ad timer
      if (nextAdTimerRef.current) {
        clearTimeout(nextAdTimerRef.current);
      }

      // Schedule next ad after 3 second break
      nextAdTimerRef.current = setTimeout(() => {
        // Double-check conditions before showing ad
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
          // Stylist accepted - stop ad loop and show profile
          if (!showStylistProfile && !isWaitingForAd2) {
            setAcceptedConsultation(updated);
            setShowStylistProfile(true);
            showStylistProfileRef.current = true; // Update ref
            stopAllTimers(); // Stop polling

            // Stop ad loop
            setAdLoopActive(false);
            adLoopActiveRef.current = false;

            // Close any open ad
            setShowAd(false);
            setCurrentAd(null);

            // Cancel any pending next ad
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
  }, [
    consultationId,
    handleSearchFailure,
    showStylistProfile,
    isWaitingForAd2,
    stopAllTimers,
    showSecondAd,
  ]);

  // Keep refs in sync with state
  useEffect(() => {
    showStylistProfileRef.current = showStylistProfile;
    adLoopActiveRef.current = adLoopActive;
  }, [showStylistProfile, adLoopActive]);

  useEffect(() => {
    checkConsultationStatus();
    statusIntervalRef.current = setInterval(checkConsultationStatus, STATUS_POLL_INTERVAL);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + 2;
      });
    }, PROGRESS_INTERVAL);

    // Schedule initial ad (Ad #1) after delay
    if (isAdsEnabled && !hasShownInitialAd) {
      initialAdTimerRef.current = setTimeout(() => {
        showInitialAd();
      }, INITIAL_AD_DELAY);
    }

    return () => {
      stopAllTimers();
    };
  }, [checkConsultationStatus, stopAllTimers, isAdsEnabled, hasShownInitialAd, showInitialAd]);

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

  const handleCancelConsultation = async () => {
    if (!consultationId) {
      showToast('Invalid consultation reference.', 'error');
      return;
    }

    // Check if consultation can be cancelled (not accepted/assigned/active)
    if (consultationStatus === 'assigned' || consultationStatus === 'active') {
      showToast('This consultation has already been accepted and cannot be cancelled.', 'warning');
      return;
    }

    try {
      stopAllTimers();
      setLoading(true);
      await cancelConsultationMutation.mutateAsync(String(consultationId));
      showToast('Consultation cancelled successfully.', 'success');

      // Clear draft and navigate back
      await storage.removeConsultationDraft();
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ConsultationHome' as keyof CombinedStackParamList }],
        });
      }, 1500);
    } catch (err: any) {
      showToast(err?.message || 'Failed to cancel consultation. Please try again.', 'error');
      setLoading(false);
    }
  };

  // Check if consultation can be cancelled (not accepted yet)
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

    // Format rating - handle both string and number types
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
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
      <SafeAreaView className="flex-1 px-5">
        <TouchableOpacity
          className="w-10 h-10 rounded-full border border-white/20 justify-center items-center mt-4"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView contentContainerClassName="flex-grow justify-center" bounces={false}>
          <View className="bg-white rounded-[5px] p-6 items-center">
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

            {/* Cancel Button - Only show when consultation is not accepted */}
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
      </SafeAreaView>

      {/* Ad Modal */}
      <AdModal visible={showAd} ad={currentAd} onFinished={handleAdFinished} />
    </View>
  );
};

export default FindingStylist;
