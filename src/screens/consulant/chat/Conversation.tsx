import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { waitForFirebaseUser } from '@/services/firebase';

import { useAuth } from '@/contexts/AuthContext';
import { useConsultation } from '@/hooks/useConsultation';
import { useChatMessages } from '@/hooks/useChatMessages';
import { setActiveChat, clearActiveChat } from '@/api/chat/useActiveChat';
import { useFinishConsultation } from '@/api/user/consultation/useFinishConsultation';
import { useRatingConsultation } from '@/api/user/consultation/useRatingConsultation';

import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import MessageBubble from '@/components/chat/MessageBubble';
import ImageModal from '@/common/components/modals/ImageModal';
import ScrollToBottomButton from '@/components/chat/ScrollToBottomButton';
import ChatClosedBanner from '@/components/chat/ChatClosedBanner';
import ChatLoadingScreen from '@/components/chat/ChatLoadingScreen';
import EmptyMessageList from '@/components/chat/EmptyMessageList';

import type { ChatMessage } from '@/types/chat';
import type { AppStackParamList } from '@/common/types';
import GradientBackground from '@/common/components/GradientBackground';
import MessageListSkeleton from '@/common/components/skeletons/MessageSkeleton';
import FinishConsultationModal from '@/common/components/modals/FinishConsultationModal';
import RatingModal from '@/common/components/modals/RatingModal';
import InfoModal from '@/common/components/modals/InfoModal';

type RouteProps = RouteProp<AppStackParamList, 'ConsultantChat'>;

const ConsultantChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const { consultationId, asCustomer } = route.params;
  const { user } = useAuth();

  const currentUserId = user ? String(user.id) : null;
  const currentUserName = user?.name ?? 'You';
  const isConsultant = user?.role === 'consultant' && !asCustomer;

  const { consultation, loading, isOnline, reloadConsultation } = useConsultation({
    consultationId,
    isConsultant,
  });

  const {
    messages,
    loading: messagesLoading,
    loadingOlder,
    hasMore,
    realtimeEnabled,
    offlineError: messagesOfflineError,
    loadOlderMessages,
    sendMessage: sendMessageHook,
    retryMessage,
    reloadMessages,
  } = useChatMessages({
    consultationId,
    isOnline,
    currentUserId: currentUserId || '',
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isModalFromBackButton, setIsModalFromBackButton] = useState(false);
  const [showRatingSuccessModal, setShowRatingSuccessModal] = useState(false);
  const [ratingSuccessMessage, setRatingSuccessMessage] = useState<string>('');

  const finishMutation = useFinishConsultation();
  const ratingMutation = useRatingConsultation();

  const flashListRef = useRef<FlashListRef<ChatMessage>>(null);
  const scrollOffsetRef = useRef(0);
  const canNavigateRef = useRef(false);
  const isConsultationFinishedRef = useRef(false);

  const goToChatHome = useCallback(() => {
    // Consultant: go back to ConsultantTabs -> ChatTab
    if (isConsultant) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'ConsultantTabs', params: { screen: 'ChatTab' } }],
        })
      );
      return;
    }

    // Customer: go back to UserTabs -> ConsultationTab -> ConsultationHome
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'UserTabs',
            params: { screen: 'ConsultationTab', params: { screen: 'ConsultationHome' } },
          },
        ],
      })
    );
  }, [isConsultant, navigation]);

  // Set active chat when screen opens, clear when screen closes
  useEffect(() => {
    setActiveChat(consultationId).catch((error) => {
      if (__DEV__) {
        console.warn('[chat] Failed to set active chat:', error);
      }
    });

    return () => {
      if (consultationId) {
        clearActiveChat(consultationId).catch((error) => {
          if (__DEV__) {
            console.warn('[chat] Failed to clear active chat:', error);
          }
        });
      }
    };
  }, [consultationId]);

  // Reset finished flag when consultation status becomes completed
  useEffect(() => {
    if (consultation?.status === 'completed') {
      isConsultationFinishedRef.current = false;
    }
  }, [consultation?.status]);

  // Listen for consultation status changes (especially when customer completes it)
  useEffect(() => {
    if (!consultationId || !isConsultant) {
      return;
    }

    const setupStatusListener = async () => {
      const firebaseUser = await waitForFirebaseUser(3000);
      if (!firebaseUser) {
        return;
      }

      const consultationRef = firestore().collection('consultations').doc(String(consultationId));

      const unsubscribe = consultationRef.onSnapshot(
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const newStatus = data?.status;

            // If status changed to 'completed', reload the consultation
            if (newStatus === 'completed' && consultation?.status !== 'completed') {
              if (__DEV__) {
                console.log('[chat] Consultation status changed to completed, reloading...');
              }
              // Reload consultation to get updated status
              reloadConsultation();
            }
          }
        },
        (error) => {
          if (__DEV__) {
            console.warn('[chat] Failed to listen to consultation status:', error);
          }
        }
      );

      return unsubscribe;
    };

    let unsubscribe: (() => void) | null = null;
    setupStatusListener().then((unsub) => {
      unsubscribe = unsub || null;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [consultationId, isConsultant, consultation?.status, reloadConsultation]);

  // Intercept back button for customers when consultation is not completed
  useEffect(() => {
    if (!consultation || isConsultant) return;

    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // If we're already allowed to navigate (after cancel), don't intercept
      if (canNavigateRef.current) {
        canNavigateRef.current = false;
        return;
      }

      // If consultation is already completed or was just finished, allow navigation
      if (consultation.status === 'completed' || isConsultationFinishedRef.current) {
        return;
      }

      // Prevent default navigation
      e.preventDefault();

      // Show finish consultation modal and mark it as from back button
      setIsModalFromBackButton(true);
      setShowFinishModal(true);
    });

    return unsubscribe;
  }, [navigation, consultation, isConsultant]);

  const handleSend = useCallback(
    async (text: string, imageUri?: string) => {
      if (!currentUserId || !consultation) {
        return;
      }

      // Prevent sending messages if consultation is completed
      if (consultation.status === 'completed') {
        Alert.alert(
          'Consultation Completed',
          'This consultation has been completed. You can no longer send messages.',
          [{ text: 'OK' }]
        );
        // Reload consultation to ensure we have the latest status
        await reloadConsultation();
        return;
      }

      const chatOpen =
        consultation.chat_window_is_open ?? ['assigned', 'active'].includes(consultation.status);
      if (!chatOpen) {
        Alert.alert('Chat closed', 'This chat is closed for new messages.');
        return;
      }

      const result = await sendMessageHook(
        text,
        imageUri,
        currentUserId,
        currentUserName,
        isConsultant,
        chatOpen
      );

      if (result?.error) {
        if (result.error === 'Chat closed') {
          Alert.alert('Chat closed', 'This chat is closed for new messages.');
        } else if (result.error === 'No internet') {
          // Already handled in hook
        } else if (result.error === 'Failed to send') {
          Alert.alert(
            'Failed to send',
            imageUri
              ? 'Unable to send image. Please try again.'
              : 'Unable to send message. Please try again.'
          );
        }
      }
    },
    [
      consultation,
      currentUserId,
      currentUserName,
      isConsultant,
      sendMessageHook,
      reloadConsultation,
    ]
  );

  const handleRetry = useCallback(
    async (messageId: string) => {
      const message = messages.find((msg) => msg.id === messageId || msg.temp_id === messageId);
      if (!message || message.status !== 'failed') {
        return;
      }

      const result = await retryMessage(messageId, message);

      if (result?.error) {
        if (result.error === 'No internet') {
          Alert.alert('No internet', 'Please check your connection and try again.');
        } else {
          Alert.alert('Error', 'Failed to resend message.');
        }
      }
    },
    [messages, retryMessage]
  );

  const handleFinishConsultation = useCallback(async () => {
    if (!consultation) return;

    finishMutation.mutate(String(consultation.id), {
      onSuccess: async () => {
        // Mark consultation as finished locally
        isConsultationFinishedRef.current = true;
        setShowFinishModal(false);
        setIsModalFromBackButton(false);

        // Refetch consultation to get updated status
        await reloadConsultation();

        setShowRatingModal(true);
      },
      onError: (error) => {
        Alert.alert('Error', (error as any)?.message || 'Failed to finish consultation');
        console.error('errr ====', error.message);
      },
    });
  }, [consultation, finishMutation, navigation, reloadConsultation]);

  const handleBack = useCallback(() => {
    // If customer and consultation is not completed and not finished, show finish modal
    if (
      !isConsultant &&
      consultation &&
      consultation.status !== 'completed' &&
      !isConsultationFinishedRef.current
    ) {
      setIsModalFromBackButton(true);
      setShowFinishModal(true);
    } else {
      // Otherwise, go to the correct chat home (customer vs consultant)
      goToChatHome();
    }
  }, [isConsultant, consultation, goToChatHome]);

  const handleCancelFinish = useCallback(() => {
    // Close modal
    setShowFinishModal(false);

    // If modal was opened from back button, navigate back
    if (isModalFromBackButton) {
      setIsModalFromBackButton(false);
      canNavigateRef.current = true;
      goToChatHome();
    } else {
      // Otherwise, just close the modal (opened from finish button)
      setIsModalFromBackButton(false);
    }
  }, [goToChatHome, isModalFromBackButton]);

  const handleSubmitRating = useCallback(
    (rating: number, feedback: string) => {
      if (!consultation) return;

      ratingMutation.mutate(
        {
          consultationId: String(consultation.id),
          rating: rating,
          user_feedback: feedback,
        },
        {
          onSuccess: async (data) => {
            setShowRatingModal(false);
            // Refetch consultation to get updated status
            await reloadConsultation();
            setRatingSuccessMessage(`Thank you for rating this consultation with ${rating} stars!`);
            setShowRatingSuccessModal(true);
          },
          onError: (error) => {
            Alert.alert('Error', (error as any)?.message || 'Failed to submit rating');
          },
        }
      );
    },
    [consultation, ratingMutation, reloadConsultation]
  );

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isOwn = currentUserId === item.user_id;
      return (
        <MessageBubble
          message={item}
          isOwnMessage={!!isOwn}
          onImagePress={setSelectedImage}
          onRetry={handleRetry}
        />
      );
    },
    [currentUserId, handleRetry]
  );

  const renderHeader = () => {
    if (!loadingOlder || !hasMore) {
      return null;
    }
    return (
      <View className="p-4 items-center">
        <ActivityIndicator size="small" color="#27B07D" />
      </View>
    );
  };

  if (!consultation) {
    return <ChatLoadingScreen onBack={() => goToChatHome()} />;
  }

  // Chat window is open only if:
  // 1. chat_window_is_open is explicitly true, OR
  // 2. Status is 'assigned' or 'active' (and NOT 'completed')
  const chatWindowOpen =
    consultation.status !== 'completed' &&
    (consultation.chat_window_is_open ?? ['assigned', 'active'].includes(consultation.status));

  return (
    <GradientBackground edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ChatHeader
          consultation={consultation}
          onBack={handleBack}
          onFinish={() => {
            setIsModalFromBackButton(false);
            setShowFinishModal(true);
          }}
          isConsultant={!!isConsultant}
          isConnecting={!isOnline}
          isLoading={loading && messages.length === 0}
          isFinishing={finishMutation.isPending}
        />

        {messagesLoading && messages.length === 0 ? (
          <MessageListSkeleton />
        ) : (
          <FlashList
            ref={flashListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 16, paddingBottom: 20 }}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={() => (
              <EmptyMessageList
                offlineError={messagesOfflineError}
                hasMessages={messages.length > 0}
                loading={messagesLoading}
                onRetry={reloadMessages}
                realtimeEnabled={realtimeEnabled}
              />
            )}
            maintainVisibleContentPosition={{
              autoscrollToBottomThreshold: 0.2,
              startRenderingFromBottom: true,
            }}
            onStartReached={loadOlderMessages}
            onStartReachedThreshold={0.4}
            onScroll={(event) => {
              const offsetY = event.nativeEvent.contentOffset.y;
              scrollOffsetRef.current = offsetY;
              setShowScrollToBottom(offsetY > 100);
            }}
            scrollEventThrottle={16}
          />
        )}

        {!chatWindowOpen && <ChatClosedBanner />}

        <ChatInput
          onSend={handleSend}
          disabled={!chatWindowOpen}
          placeholder="Type message here..."
        />

        <ScrollToBottomButton
          visible={showScrollToBottom}
          onPress={() => {
            flashListRef.current?.scrollToEnd({ animated: true });
            setShowScrollToBottom(false);
          }}
        />
      </KeyboardAvoidingView>

      <ImageModal
        visible={!!selectedImage}
        imageUri={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      <FinishConsultationModal
        visible={showFinishModal}
        onClose={handleCancelFinish}
        onConfirm={handleFinishConsultation}
        isLoading={finishMutation.isPending}
      />

      <RatingModal
        visible={showRatingModal}
        consultantName={
          isConsultant
            ? consultation.user?.name || 'Client'
            : consultation.consultant?.name || 'Stylist'
        }
        onClose={async () => {
          setShowRatingModal(false);
          // When rating is skipped, refetch consultation to get updated status
          await reloadConsultation();
        }}
        onSubmit={handleSubmitRating}
        isLoading={ratingMutation.isPending}
      />

      <InfoModal
        visible={showRatingSuccessModal}
        title="Thank you!"
        message={ratingSuccessMessage}
        variant="success"
        onConfirm={() => {
          setShowRatingSuccessModal(false);
          goToChatHome();
        }}
        onClose={() => {
          setShowRatingSuccessModal(false);
          goToChatHome();
        }}
      />
    </GradientBackground>
  );
};

export default ConsultantChatScreen;
