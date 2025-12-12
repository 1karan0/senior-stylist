import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { useConsultation } from '@/hooks/useConsultation';
import { useChatMessages } from '@/hooks/useChatMessages';
import { setActiveChat, clearActiveChat } from '@/api/chat/useActiveChat';
import { useFinishConsultation } from '@/api/user/consultation/useFinishConsultation';
import { useRatingConsultation } from '@/api/user/consultation/useRatingConsultation';

import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import MessageBubble from '@/components/chat/MessageBubble';
import ImageModal from '@/components/chat/ImageModal';
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

type RouteProps = RouteProp<AppStackParamList, 'ConsultantChat'>;

const ConsultantChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { consultationId, asCustomer } = route.params;
  const { user } = useAuth();

  const currentUserId = user ? String(user.id) : null;
  const currentUserName = user?.name ?? 'You';
  const isConsultant = user?.role === 'consultant' && !asCustomer;

  const { consultation, loading, isOnline } = useConsultation({
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

  const finishMutation = useFinishConsultation();
  const ratingMutation = useRatingConsultation();

  const flashListRef = useRef<FlashListRef<ChatMessage>>(null);
  const scrollOffsetRef = useRef(0);

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

  const handleSend = useCallback(
    async (text: string, imageUri?: string) => {
      if (!currentUserId || !consultation) {
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
    [consultation, currentUserId, currentUserName, isConsultant, sendMessageHook]
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
      onSuccess: () => {
        setShowFinishModal(false);
        setShowRatingModal(true);
      },
      onError: (error) => {
        Alert.alert('Error', (error as any)?.message || 'Failed to finish consultation');
        console.error('errr ====', error.message);
      },
    });
  }, [consultation, finishMutation, navigation]);

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
          onSuccess: (data) => {
            setShowRatingModal(false);
            Alert.alert(
              'Thank you!',
              `Thank you for rating this consultation with ${rating} stars!`,
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          },
          onError: (error) => {
            Alert.alert('Error', (error as any)?.message || 'Failed to submit rating');
          },
        }
      );
    },
    [consultation, ratingMutation, navigation]
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
    return <ChatLoadingScreen onBack={() => navigation.goBack()} />;
  }

  const chatWindowOpen =
    consultation.chat_window_is_open ?? ['assigned', 'active'].includes(consultation.status);

  return (
    <GradientBackground edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ChatHeader
          consultation={consultation}
          onBack={() => navigation.goBack()}
          onFinish={() => setShowFinishModal(true)}
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
        onClose={() => setShowFinishModal(false)}
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
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleSubmitRating}
        isLoading={ratingMutation.isPending}
      />
    </GradientBackground>
  );
};

export default ConsultantChatScreen;
