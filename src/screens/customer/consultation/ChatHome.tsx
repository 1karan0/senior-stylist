import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Text, View, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { useGetPendingReviews } from '@/api/user/consultation/useGetPendingReviews';
import { useRatingConsultation } from '@/api/user/consultation/useRatingConsultation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useConsultations } from '@/hooks/useConsultations';

import GradientBackground from '@/common/components/GradientBackground';
import ConversationSkeleton from '@/common/components/skeletons/ConversationSkeleton';
import ConversationItem from '@/components/chat/ConversationItem';
import ChatHomeHeader from '@/components/chat/ChatHomeHeader';
import RatingModal from '@/common/components/modals/RatingModal';
import type {
  AppStackParamList,
  ConsultationStackParamList,
  ConversationPreview,
} from '@/common/types';
import { createPreview, filterConversations } from '@/utils/consultationUtils';
import InfoModal from '@/common/components/modals/InfoModal';

type NavParamList = AppStackParamList & ConsultationStackParamList;

const CustomerChatHome: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const navigation = useNavigation<NativeStackNavigationProp<NavParamList>>();
  const queryClient = useQueryClient();

  const userKey = useMemo(() => (user?.id ? String(user.id) : null), [user?.id]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentReviewIndex, setCurrentReviewIndex] = useState<number | null>(null);
  const [dismissedReviewIds, setDismissedReviewIds] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showRatingSuccessModal, setShowRatingSuccessModal] = useState(false);
  const [ratingSuccessMessage, setRatingSuccessMessage] = useState<string>('');

  const { consultations, loading, refreshing, isRealtimeConnected, refreshConversations } =
    useConsultations({ userKey });

  const previews: ConversationPreview[] = useMemo(
    () => consultations.filter((c) => c.status !== 'cancelled').map((c) => createPreview(c)),
    [consultations]
  );

  const filteredConvos = useMemo(
    () => filterConversations(previews, searchQuery),
    [previews, searchQuery]
  );

  const {
    data: pendingReviews,
    refetch: refetchPendingReviews,
    isLoading: isLoadingReviews,
    isError: isErrorReviews,
    error: errorReviews,
  } = useGetPendingReviews();
  const ratingMutation = useRatingConsultation();

  // Track dismissed reviews only in memory (resets on app restart)
  // This ensures dismissed modals show again after app restart

  // Refetch pending reviews when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchPendingReviews();
    }, [refetchPendingReviews])
  );

  // Filter reviews that haven't been dismissed
  const availableReviews = useMemo(() => {
    if (!pendingReviews || !Array.isArray(pendingReviews)) {
      return [];
    }
    const filtered = pendingReviews.filter((review: any) => {
      const reviewId = String(review.id || review.consultation_id);
      return !dismissedReviewIds.includes(reviewId);
    });
    return filtered;
  }, [pendingReviews, dismissedReviewIds]);

  // Show next review modal when available reviews change
  useEffect(() => {
    // Show modal if there are available reviews and no modal is currently showing
    if (availableReviews.length > 0) {
      if (currentReviewIndex === null) {
        setCurrentReviewIndex(0);
        setIsModalVisible(true);
      }
    } else if (availableReviews.length === 0 && currentReviewIndex !== null) {
      setCurrentReviewIndex(null);
      setIsModalVisible(false);
    }
  }, [
    availableReviews,
    currentReviewIndex,
    isModalVisible,
    isLoadingReviews,
    isErrorReviews,
    pendingReviews,
  ]);

  // Handle review submission
  const handleSubmitReview = useCallback(
    async (rating: number, review: string) => {
      if (currentReviewIndex === null || !availableReviews[currentReviewIndex]) return;

      const currentReview = availableReviews[currentReviewIndex];
      const consultationId = String(currentReview.id || currentReview.consultation_id);

      ratingMutation.mutate(
        {
          consultationId,
          rating,
          user_feedback: review,
        },
        {
          onSuccess: async () => {
            // Remove from dismissed list (in-memory)
            setDismissedReviewIds((prev) => prev.filter((id) => id !== consultationId));

            // Move to next review or close modal
            if (currentReviewIndex < availableReviews.length - 1) {
              setCurrentReviewIndex(currentReviewIndex + 1);
            } else {
              setCurrentReviewIndex(null);
              setIsModalVisible(false);
            }

            // Refetch pending reviews
            await refetchPendingReviews();
            queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
            setShowRatingSuccessModal(true);
            setRatingSuccessMessage(
              `Thank you for giving the ${rating} ${rating === 1 ? 'star' : 'stars'} rating! to your consultant ${consultantName}.`
            );
          },
          onError: (error: any) => {
            Alert.alert('Error', error?.message || 'Failed to submit review. Please try again.');
          },
        }
      );
    },
    [currentReviewIndex, availableReviews, ratingMutation, refetchPendingReviews, queryClient]
  );

  // Handle modal close (dismiss)
  const handleCloseModal = useCallback(() => {
    if (currentReviewIndex === null || !availableReviews[currentReviewIndex]) return;

    const currentReview = availableReviews[currentReviewIndex];
    const consultationId = String(currentReview.id || currentReview.consultation_id);

    // Add to dismissed list (in-memory only, resets on app restart)
    setDismissedReviewIds((prev) => {
      if (!prev.includes(consultationId)) {
        return [...prev, consultationId];
      }
      return prev;
    });

    // Move to next review or close modal
    if (currentReviewIndex < availableReviews.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
      // Keep modal visible for next review
    } else {
      setCurrentReviewIndex(null);
      setIsModalVisible(false);
    }
  }, [currentReviewIndex, availableReviews]);

  // Get current review data
  const currentReview = useMemo(() => {
    if (currentReviewIndex === null || !availableReviews[currentReviewIndex]) return null;
    return availableReviews[currentReviewIndex];
  }, [currentReviewIndex, availableReviews]);

  // Get consultant name from current review
  const consultantName = useMemo(() => {
    if (!currentReview) return 'Stylist';
    return (
      currentReview.consultant?.name ||
      currentReview.consultant_name ||
      currentReview.consultantName ||
      'Stylist'
    );
  }, [currentReview]);

  return (
    <GradientBackground className="flex-1">
      <View className="flex-1">
        <ChatHomeHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isRealtimeConnected={isRealtimeConnected}
        />

        {loading && consultations.length === 0 ? (
          <View className="flex-1 px-5 mb-8 mt-4">
            <View>
              {[...Array(8)].map((_, i) => (
                <ConversationSkeleton key={i} />
              ))}
            </View>
          </View>
        ) : (
          <View className="flex-1 px-5 mb-8 mt-4">
            <FlashList
              data={filteredConvos}
              keyExtractor={(item: ConversationPreview) => item.id.toString()}
              renderItem={({ item }) => (
                <ConversationItem
                  item={item}
                  onPress={() =>
                    navigation.navigate('ConsultantChat', {
                      consultationId: item.id,
                      asCustomer: true,
                    })
                  }
                />
              )}
              showsVerticalScrollIndicator={false}
              onRefresh={refreshConversations}
              refreshing={refreshing}
              ListEmptyComponent={() => (
                <View className="flex-1 items-center justify-center mt-14 px-10">
                  <Text className={`${isDark ? 'text-white' : 'text-textMuted'} text-base mb-1`}>
                    No consultations yet
                  </Text>
                  <Text
                    className={`${isDark ? 'text-white' : 'text-textMuted'} text-xs text-center`}
                  >
                    Start a new consultation to begin chatting with a stylist.
                  </Text>
                </View>
              )}
              contentContainerStyle={{ paddingVertical: 4, paddingBottom }}
            />
          </View>
        )}
      </View>

      {/* Review Modal */}
      {currentReview && (
        <RatingModal
          visible={isModalVisible}
          onClose={handleCloseModal}
          onSubmit={handleSubmitReview}
          isLoading={ratingMutation.isPending}
          consultantName={consultantName}
          consultationDetails={{
            id: currentReview.id,
            problem_description: currentReview.problem_description,
            completed_at: currentReview.completed_at,
            image_public_url: currentReview.image_public_url,
            stylistName:
              currentReview.consultant?.name ||
              currentReview.consultant_name ||
              currentReview.consultantName ||
              consultantName,
            stylistImageUrl:
              currentReview.consultant?.profile_picture_url ||
              currentReview.consultant_profile_picture_url ||
              null,
          }}
          showConsultationDetails={true}
        />
      )}

      <InfoModal
        visible={showRatingSuccessModal}
        title="Thank you!"
        message={ratingSuccessMessage}
        variant="success"
        onConfirm={() => {
          setShowRatingSuccessModal(false);
        }}
        onClose={() => {
          setShowRatingSuccessModal(false);
        }}
      />
    </GradientBackground>
  );
};

export default CustomerChatHome;
