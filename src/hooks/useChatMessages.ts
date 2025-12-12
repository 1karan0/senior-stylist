import { useCallback, useEffect, useRef, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { consultationMessagesApi } from '@/api/consultations/messages';
import { sendMessageToFirestore, waitForFirebaseUser } from '@/services/firebase';
import {
  getMessages,
  initChatDatabase,
  markAllAsRead,
  saveMessage,
  saveMessages,
  updateMessageStatus,
} from '@/services/chatDatabase';
import type { ChatMessage } from '@/types/chat';
import NetInfo from '@react-native-community/netinfo';

const PAGE_SIZE = 20;
const REALTIME_LIMIT = 50;

interface UseChatMessagesOptions {
  consultationId: number;
  isOnline: boolean;
  currentUserId: string | null;
}

export const useChatMessages = ({
  consultationId,
  isOnline,
  currentUserId,
}: UseChatMessagesOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);

  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initChatDatabase();
  }, []);

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
      } finally {
        if (reset) {
          setLoading(false);
        }
      }
    },
    [consultationId, isOnline]
  );

  useEffect(() => {
    loadMessages(true);
  }, [loadMessages]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let mounted = true;

    const setup = async () => {
      const firebaseUser = await waitForFirebaseUser(5000);
      if (!firebaseUser) {
        return;
      }

      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
      }

      const messagesRef = firestore()
        .collection('consultations')
        .doc(String(consultationId))
        .collection('messages')
        .orderBy('created_at', 'desc')
        .limit(REALTIME_LIMIT);

      const unsubscribe = messagesRef.onSnapshot(
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
                return Math.abs(existingTime - msgTime) < 8000;
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

  const sendMessage = useCallback(
    async (
      text: string,
      imageUri: string | undefined,
      currentUserId: string,
      currentUserName: string,
      isConsultant: boolean,
      chatWindowOpen: boolean
    ) => {
      if ((!text.trim() && !imageUri) || !currentUserId) {
        return;
      }
      if (!chatWindowOpen) {
        return { error: 'Chat closed' };
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
        return { error: 'No internet' };
      }

      try {
        const firestoreId = await sendMessageToFirestore(
          consultationId,
          currentUserId,
          currentUserName,
          isConsultant,
          text,
          imageUri
        );
        await updateMessageStatus(consultationId, tempId, 'sent', firestoreId);
        return { success: true };
      } catch (error) {
        if (__DEV__) {
          console.warn('[chat] send failed, marking as failed', error);
        }
        await updateMessageStatus(consultationId, tempId, 'failed');
        return { error: 'Failed to send' };
      }
    },
    [consultationId]
  );

  const retryMessage = useCallback(
    async (messageId: string, message: ChatMessage) => {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        return { error: 'No internet' };
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
        return { success: true };
      } catch {
        await updateMessageStatus(consultationId, messageId, 'failed');
        return { error: 'Failed to resend' };
      }
    },
    [consultationId]
  );

  return {
    messages,
    loading,
    loadingOlder,
    hasMore,
    realtimeEnabled,
    offlineError,
    loadOlderMessages,
    sendMessage,
    retryMessage,
    reloadMessages: () => loadMessages(true),
  };
};
