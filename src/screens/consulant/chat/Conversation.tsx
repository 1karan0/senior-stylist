import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import Ionicons from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  collection,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import { useAuth } from '@/contexts/AuthContext';
import { ConsultantConsultation, consultantConsultationsApi } from '@/api/consultant/consultations';
import { customerConsultationsApi } from '@/api/customer/consultations';
import { consultationMessagesApi } from '@/api/consultations/messages';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import MessageBubble from '@/components/chat/MessageBubble';
import ImageModal from '@/components/chat/ImageModal';
import {
  getFirestoreInstance,
  sendMessageToFirestore,
  waitForFirebaseUser,
} from '@/services/firebase';
import {
  getCachedConsultation,
  getMessages,
  initChatDatabase,
  markAllAsRead,
  saveConsultation,
  saveMessage,
  saveMessages,
  updateMessageStatus,
} from '@/services/chatDatabase';
import type { ChatMessage } from '@/types/chat';
import type { AppStackParamList } from '@/common/types';
import GradientBackground from '@/common/components/GradientBackground';

type RouteProps = RouteProp<AppStackParamList, 'ConsultantChat'>;

const PAGE_SIZE = 20;
const REALTIME_LIMIT = 50;

const ConsultantChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { consultationId, asCustomer } = route.params;
  const { user } = useAuth();

  const currentUserId = user ? String(user.id) : null;
  const currentUserName = user?.name ?? 'You';
  const isConsultant = user?.role === 'consultant' && !asCustomer;

  const [consultation, setConsultation] = useState<ConsultantConsultation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const flashListRef = useRef<FlashListRef<ChatMessage>>(null);
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    initChatDatabase();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected));
      if (state.isConnected && offlineError) {
        setOfflineError(null);
      }
    });
    return () => unsubscribe();
  }, [offlineError]);

  const loadConsultation = useCallback(async () => {
    setLoading(true);
    try {
      const cached = await getCachedConsultation(consultationId);
      if (cached) {
        setConsultation(cached);
      }

      if (!isOnline) {
        if (!cached) {
          setOfflineError('Offline. Consultation not cached.');
        }
        return;
      }

      if (isConsultant) {
        const latest = await consultantConsultationsApi.get(consultationId);
        if (latest) {
          setConsultation(latest);
          await saveConsultation(latest);
        } else if (!cached) {
          setOfflineError('Consultation not found.');
        }
      } else {
        // Customer view uses the customer consultation API to ensure we see
        // the assigned stylist details as soon as they are available.
        const response = await customerConsultationsApi.get(consultationId);
        const latest = response.data?.consultation;
        if (latest) {
          setConsultation(latest);
          await saveConsultation(latest);
        } else if (!cached) {
          setOfflineError('Unable to load consultation details.');
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[chat] failed to load consultation', error);
      }
      const cached = await getCachedConsultation(consultationId);
      if (cached) {
        setConsultation(cached);
        setOfflineError('Unable to refresh consultation. Showing cached data.');
      } else {
        setOfflineError('Unable to load consultation.');
      }
    } finally {
      setLoading(false);
    }
  }, [consultationId, isConsultant, isOnline]);

  const loadMessages = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setOfflineError(null);
        }
        const cached = await getMessages(consultationId, PAGE_SIZE);
        if (cached.length && reset) {
          setMessages(cached);
        }

        if (!isOnline) {
          if (!cached.length) {
            setOfflineError('Offline. No cached messages available.');
          } else if (reset) {
            setOfflineError('Offline. Showing cached messages.');
          }
          return;
        }

        const response = await consultationMessagesApi.list(consultationId, { limit: PAGE_SIZE });
        if (response?.messages?.length) {
          await saveMessages(consultationId, response.messages);
          setMessages(
            response.messages
              .slice()
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          );
          setHasMore(response.has_more ?? false);
        } else if (!cached.length) {
          setMessages([]);
          setHasMore(false);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('[chat] failed to load messages', error);
        }
        if (reset) {
          const cachedMessages = await getMessages(consultationId, PAGE_SIZE);
          if (cachedMessages.length) {
            setMessages(cachedMessages);
            setOfflineError('Unable to refresh messages. Showing cached data.');
          } else {
            setOfflineError('Unable to load messages.');
          }
        }
      }
    },
    [consultationId, isOnline]
  );

  useEffect(() => {
    loadConsultation();
    loadMessages(true);
  }, [loadConsultation, loadMessages]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let mounted = true;

    const setup = async () => {
      const firestore = getFirestoreInstance();
      if (!firestore) {
        return;
      }

      const firebaseUser = await waitForFirebaseUser(5000);
      if (!firebaseUser) {
        return;
      }

      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
      }

      const messagesRef = collection(
        firestore,
        'consultations',
        String(consultationId),
        'messages'
      );
      const q = query(messagesRef, orderBy('created_at', 'desc'), firestoreLimit(REALTIME_LIMIT));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!mounted) {
            return;
          }
          const realtime = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                user_id: data.user_id ?? '',
                user_name: data.user_name ?? '',
                message: data.message ?? undefined,
                message_type: data.message_type ?? 'text',
                attachment_url: data.attachment_url ?? undefined,
                link_preview: data.link_preview,
                is_read: Boolean(data.is_read),
                created_at:
                  typeof data.created_at === 'string'
                    ? data.created_at
                    : (data.created_at?.toDate?.().toISOString?.() ?? new Date().toISOString()),
              } as ChatMessage;
            })
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          if (realtime.length) {
            saveMessages(consultationId, realtime).catch(() => {});
          }

          setMessages((prev) => {
            const map = new Map<string, ChatMessage>();
            prev.forEach((msg) => map.set(msg.id, msg));

            realtime.forEach((msg) => {
              // Try to find and remove a matching temp message (pending) created locally.
              // For image messages, we intentionally ignore attachment_url because the local
              // URI (file://) will differ from the remote download URL stored in Firestore.
              const tempMatch = Array.from(map.values()).find((existing) => {
                if (!existing.temp_id) return false;
                if (existing.user_id !== msg.user_id) return false;

                const bothImage = existing.message_type === 'image' || msg.message_type === 'image';

                if (!bothImage) {
                  if ((existing.message || '') !== (msg.message || '')) return false;
                  if ((existing.attachment_url || '') !== (msg.attachment_url || '')) {
                    return false;
                  }
                }

                const existingTime = new Date(existing.created_at).getTime();
                const msgTime = new Date(msg.created_at).getTime();
                return Math.abs(existingTime - msgTime) < 8000; // allow a bit more skew
              });

              if (tempMatch) {
                map.delete(tempMatch.id);
              }

              map.set(msg.id, { ...msg, status: 'sent' });
            });

            return Array.from(map.values()).sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
          setRealtimeEnabled(true);
        },
        (error) => {
          if (__DEV__) {
            console.error('[chat] realtime listener error', error);
          }
          setRealtimeEnabled(false);
        }
      );

      realtimeUnsubscribeRef.current = unsubscribe;
    };

    setup();
    return () => {
      mounted = false;
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
      }
    };
  }, [consultationId, currentUserId]);

  useEffect(() => {
    return () => {
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      markAllAsRead(consultationId).catch(() => {});
      consultationMessagesApi.markChatRead(consultationId).catch(() => {});
    }
  }, [consultationId, messages.length]);

  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || loadingOlder) {
      return;
    }
    setLoadingOlder(true);
    try {
      const oldest = messages[0];
      if (!oldest) {
        return;
      }
      const response = await consultationMessagesApi.list(consultationId, {
        limit: PAGE_SIZE,
        before: oldest.created_at,
      });
      if (response?.messages?.length) {
        await saveMessages(consultationId, response.messages);
        setMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          [...response.messages, ...prev].forEach((msg) => map.set(msg.id, msg));
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        setHasMore(response.has_more ?? false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[chat] failed to load older messages', error);
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [consultationId, hasMore, loadingOlder, messages]);

  const handleSend = useCallback(
    async (text: string, imageUri?: string) => {
      if ((!text.trim() && !imageUri) || !currentUserId) {
        return;
      }
      const chatOpen =
        consultation?.chat_window_is_open ??
        ['assigned', 'active'].includes(consultation?.status || '');
      if (!chatOpen) {
        Alert.alert('Chat closed', 'This chat is closed for new messages.');
        return;
      }

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const pending: ChatMessage = {
        id: tempId,
        temp_id: tempId,
        user_id: currentUserId,
        user_name: currentUserName,
        message: text || undefined,
        message_type: imageUri ? 'image' : 'text',
        attachment_url: imageUri ?? undefined,
        is_read: false,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, pending]);
      saveMessage(consultationId, pending).catch(() => {});

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        return;
      }

      try {
        const firestoreId = await sendMessageToFirestore(
          consultationId,
          currentUserId,
          currentUserName,
          !!isConsultant,
          text,
          imageUri
        );
        await updateMessageStatus(consultationId, tempId, 'sent', firestoreId);
      } catch (error) {
        if (__DEV__) {
          console.warn('[chat] send failed, marking as failed', error);
        }
        await updateMessageStatus(consultationId, tempId, 'failed');
        Alert.alert(
          'Failed to send',
          imageUri
            ? 'Unable to send image. Please try again.'
            : 'Unable to send message. Please try again.'
        );
      }
    },
    [consultation, consultationId, currentUserId, currentUserName, isConsultant]
  );

  const handleRetry = useCallback(
    async (messageId: string) => {
      const message = messages.find((msg) => msg.id === messageId || msg.temp_id === messageId);
      if (!message || message.status !== 'failed') {
        return;
      }

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        Alert.alert('No internet', 'Please check your connection and try again.');
        return;
      }

      await updateMessageStatus(consultationId, messageId, 'pending');
      try {
        const firestoreId = await sendMessageToFirestore(
          consultationId,
          message.user_id,
          message.user_name,
          true,
          message.message,
          message.attachment_url
        );
        await updateMessageStatus(consultationId, messageId, 'sent', firestoreId);
      } catch {
        await updateMessageStatus(consultationId, messageId, 'failed');
        Alert.alert('Error', 'Failed to resend message.');
      }
    },
    [consultationId, messages]
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

  const renderEmpty = () => {
    if (offlineError && messages.length === 0) {
      return (
        <View className="flex-1 justify-center items-center p-10">
          <Text className="text-[#FF4433] text-base text-center mb-4">{offlineError}</Text>
          <TouchableOpacity
            className="bg-[#27B07D] px-6 py-3 rounded-lg"
            onPress={() => {
              if (!realtimeEnabled) {
                loadMessages(true);
              }
            }}
          >
            <Text className="text-white text-base font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (messages.length === 0 && !loading) {
      return (
        <View className="flex-1 justify-center items-center p-10">
          <Text className="text-[#A1A09A] text-base text-center">
            No messages yet. Start the conversation!
          </Text>
        </View>
      );
    }
    return null;
  };

  if (!consultation) {
    return (
      <LinearGradient colors={['#0E1B16', '#152821']} className="flex-1">
        <View className="bg-[#27B07D] pt-[50px] pb-4 px-4 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center justify-center">
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text className="text-white text-sm font-medium ml-2">Loading chat…</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  const chatWindowOpen =
    consultation.chat_window_is_open ?? ['assigned', 'active'].includes(consultation.status);

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ChatHeader
          consultation={consultation}
          onBack={() => navigation.goBack()}
          isConsultant={!!isConsultant}
          isConnecting={!isOnline}
          isLoading={loading && messages.length === 0}
        />

        {loading && messages.length === 0 ? (
          <View className="absolute top-[110px] left-0 right-0 items-center z-10 pointer-events-none">
            <View className="flex-row items-center bg-white/25 rounded-full px-3 py-1.5 gap-2">
              <ActivityIndicator size="small" color="#1C1C1C" />
              <Text className="text-[#1C1C1C] text-xs font-medium">Loading messages…</Text>
            </View>
          </View>
        ) : null}

        <FlashList
          ref={flashListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 20 }}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
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

        {!chatWindowOpen ? (
          <View className="bg-[#1A1A1A] p-3 border-t border-[#152821]">
            <Text className="text-[#A1A09A] text-xs text-center">
              This chat is closed for new messages.
            </Text>
          </View>
        ) : null}

        <ChatInput
          onSend={handleSend}
          disabled={!chatWindowOpen}
          placeholder="Type message here..."
        />

        {showScrollToBottom ? (
          <TouchableOpacity
            className="absolute bottom-[100px] right-4"
            onPress={() => {
              flashListRef.current?.scrollToEnd({ animated: true });
              setShowScrollToBottom(false);
            }}
            activeOpacity={0.7}
          >
            <View className="w-11 h-11 rounded-full bg-black/50 justify-center items-center">
              <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) : null}
      </KeyboardAvoidingView>

      <ImageModal
        visible={!!selectedImage}
        imageUri={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </GradientBackground>
  );
};

export default ConsultantChatScreen;
