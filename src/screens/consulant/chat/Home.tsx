import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  collection,
  getDocs,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getFirestoreInstance, initializeFirebase, waitForFirebaseUser } from '@/services/firebase';
import { consultantConsultationsApi, ConsultantConsultation } from '@/api/consultant/consultations';
import { mapFirestoreConsultation } from '@/utils/firestoreConsultationMapper';
import {
  getCachedConsultations,
  initChatDatabase,
  saveConsultations,
} from '@/services/chatDatabase';
import type { AppStackParamList } from '@/common/types';

type ConversationPreview = {
  id: number;
  customerName: string;
  avatarUrl?: string | null;
  lastMessage: string;
  lastMessageAt?: string | null;
  unreadCount: number;
};

type FilterKey = 'all' | 'unread';

const MAX_ITEMS = 40;

/**
 * Keep these values in sync with tailwind.config.js:
 * - bgLight0/bgLight1
 * - bgDark0/bgDark1
 * - textDark, textMuted, textWhite
 * - buttonPrimaryBg
 */
const LIGHT_BG = ['hsl(146 25% 97%)', 'hsl(158 64% 95%)'];
const DARK_BG = ['hsl(158 32% 8%)', 'hsl(158 32% 12%)'];

const TEXT_MUTED = '#658176';
const TEXT_DARK = '#162721';
const TEXT_WHITE = '#FFFFFF';
const BUTTON_PRIMARY = '#27B07D';
const SURFACE_DARK = 'rgba(14,27,22,0.85)';
const BORDER_LIGHT = '#DAE7E0';
const BORDER_DARK = '#273F36';

const ChatHome: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const consultantKey = useMemo(() => (user?.id ? String(user.id) : null), [user?.id]);

  const [consultations, setConsultations] = useState<ConsultantConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [isRealtimeConnected, setRealtimeConnected] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const gradientColors = isDark ? DARK_BG : LIGHT_BG;
  const surfaceColor = isDark ? SURFACE_DARK : TEXT_WHITE;
  const borderColor = isDark ? BORDER_DARK : BORDER_LIGHT;
  const textPrimary = isDark ? TEXT_WHITE : TEXT_DARK;
  const textMuted = TEXT_MUTED;

  const getTimestampValue = useCallback((value?: string | null) => {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }, []);

  const sortByLatest = useCallback(
    (items: ConsultantConsultation[]) =>
      [...items].sort(
        (a, b) =>
          getTimestampValue(b.last_message_at ?? b.requested_at) -
          getTimestampValue(a.last_message_at ?? a.requested_at)
      ),
    [getTimestampValue]
  );

  const mergeConsultations = useCallback(
    (existing: ConsultantConsultation[], incoming: ConsultantConsultation[]) => {
      const map = new Map<number, ConsultantConsultation>();
      existing.forEach((item) => map.set(item.id, item));
      incoming.forEach((item) => {
        const previous = map.get(item.id);
        map.set(item.id, { ...previous, ...item });
      });
      return Array.from(map.values());
    },
    []
  );

  const createPreview = useCallback(
    (consultation: ConsultantConsultation): ConversationPreview => ({
      id: consultation.id,
      customerName: consultation.user?.name || 'Unknown User',
      avatarUrl: consultation.user?.profile_picture_url,
      lastMessage:
        consultation.last_message || consultation.problem_description || 'Tap to view conversation',
      lastMessageAt: consultation.last_message_at ?? consultation.requested_at,
      unreadCount: consultation.unread_count_consultant ?? 0,
    }),
    []
  );

  useEffect(() => {
    initChatDatabase();
  }, []);

  const filterByConsultant = useCallback(
    (items: ConsultantConsultation[]) =>
      consultantKey
        ? items.filter((item) => String(item.consultant_id ?? '') === consultantKey)
        : [],
    [consultantKey]
  );

  const fetchFromFirestore = useCallback(async () => {
    if (!consultantKey) {
      return [];
    }
    const firestore = getFirestoreInstance();
    if (!firestore) {
      return [];
    }

    const baseQuery = query(
      collection(firestore, 'consultations'),
      where('consultant_id', '==', consultantKey),
      orderBy('last_message_at', 'desc'),
      firestoreLimit(MAX_ITEMS)
    );

    const snapshot = await getDocs(baseQuery);
    return snapshot.docs.map((doc) => mapFirestoreConsultation(doc.id, doc.data()));
  }, [consultantKey]);

  const fetchFromApi = useCallback(async () => {
    try {
      const response = await consultantConsultationsApi.list();
      return response;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch consultations via API:', error);
      }
      return [];
    }
  }, []);

  const subscribeToRealtime = useCallback(async () => {
    if (!consultantKey) {
      return;
    }
    const firestore = getFirestoreInstance();
    if (!firestore) {
      return;
    }

    const firebaseUser = await waitForFirebaseUser(3000);
    if (!firebaseUser) {
      return;
    }

    const realtimeQuery = query(
      collection(firestore, 'consultations'),
      where('consultant_id', '==', consultantKey),
      orderBy('last_message_at', 'desc'),
      firestoreLimit(MAX_ITEMS)
    );

    const unsubscribe = onSnapshot(
      realtimeQuery,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => mapFirestoreConsultation(doc.id, doc.data()));
        const realtimeIds = new Set(docs.map((doc) => doc.id));
        setRealtimeConnected(!snapshot.metadata.fromCache);
        setConsultations((prev) => {
          const older = prev.filter((item) => !realtimeIds.has(item.id));
          return sortByLatest(mergeConsultations(older, docs));
        });
        if (docs.length) {
          saveConsultations(docs).catch((error) => {
            if (__DEV__) {
              console.warn('[chat] failed to cache realtime consultations', error);
            }
          });
        }
      },
      (error) => {
        if (__DEV__) {
          console.error('Consultant chat realtime listener error:', error);
        }
        setRealtimeConnected(false);
      }
    );

    unsubscribeRef.current = unsubscribe;
  }, [consultantKey, mergeConsultations, sortByLatest]);

  const loadConversations = useCallback(
    async (showLoader: boolean) => {
      if (!consultantKey) {
        setLoading(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      await initializeFirebase();

      try {
        const cached = await getCachedConsultations();
        if (cached.length) {
          const filtered = filterByConsultant(cached);
          if (filtered.length) {
            setConsultations(sortByLatest(filtered));
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[chat] failed to load cached consultations', error);
        }
      }

      try {
        const firebaseItems = await fetchFromFirestore();
        if (firebaseItems.length) {
          await saveConsultations(firebaseItems);
          setConsultations(sortByLatest(firebaseItems));
        } else {
          const fallback = await fetchFromApi();
          await saveConsultations(fallback);
          setConsultations(sortByLatest(fallback));
        }
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [consultantKey, fetchFromApi, fetchFromFirestore, filterByConsultant, sortByLatest]
  );

  useEffect(() => {
    loadConversations(true);
    subscribeToRealtime();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [loadConversations, subscribeToRealtime]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations(false);
    setRefreshing(false);
  }, [loadConversations]);

  const previews = useMemo(() => consultations.map(createPreview), [consultations, createPreview]);

  const filteredConversations = useMemo(() => {
    const queryLower = searchQuery.trim().toLowerCase();

    return previews.filter((conversation) => {
      const matchesSearch =
        !queryLower ||
        conversation.customerName.toLowerCase().includes(queryLower) ||
        conversation.lastMessage.toLowerCase().includes(queryLower);

      const matchesFilter =
        activeFilter === 'all' || (activeFilter === 'unread' && conversation.unreadCount > 0);

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, previews, searchQuery]);

  const formatRelativeTime = (value?: string | null) => {
    if (!value) return '';
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return '';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || 'SS';

  const handleConversationPress = (conversation: ConversationPreview) => {
    navigation.navigate('ConsultantChat', { consultationId: conversation.id });
  };

  const renderConversation = ({ item }: { item: ConversationPreview }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleConversationPress(item)}
      className={`flex-row items-center mb-4 px-4 py-3 rounded-2xl ${
        isDark ? 'bg-bgDark0 border border-bgDark1' : 'bg-white border border-bgLight1'
      }`}
      style={{
        backgroundColor: surfaceColor,
        borderWidth: 1,
        borderColor,
      }}
    >
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} className="w-14 h-14 rounded-full mr-4" />
      ) : (
        <View
          className="w-14 h-14 rounded-full mr-4 items-center justify-center"
          style={{ backgroundColor: BUTTON_PRIMARY }}
        >
          <Text className="text-white font-urbanist-semibold text-lg">
            {getInitials(item.customerName)}
          </Text>
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text
            className={`font-urbanist-semibold text-base ${isDark ? 'text-textWhite' : 'text-textDark'}`}
            numberOfLines={1}
          >
            {item.customerName}
          </Text>
          <Text className={`text-xs font-poppins ${isDark ? 'text-textMuted' : 'text-textMuted'}`}>
            {formatRelativeTime(item.lastMessageAt)}
          </Text>
        </View>
        <Text
          className={`text-sm font-poppins ${isDark ? 'text-textMuted' : 'text-textMuted'}`}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>

      {item.unreadCount > 0 && (
        <View className="ml-3 bg-buttonPrimaryBg rounded-full px-2 py-1 min-w-[28px] items-center">
          <Text className="text-white text-xs font-urbanist-semibold">
            {item.unreadCount > 99 ? '99+' : item.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    return (
      <View className="items-center justify-center py-20 px-8">
        <Text
          className={`text-xl font-urbanist-semibold mb-2 ${isDark ? 'text-textWhite' : 'text-textDark'}`}
        >
          No conversations yet
        </Text>
        <Text
          className={`text-center text-sm font-poppins ${isDark ? 'text-textMuted' : 'text-textMuted'}`}
        >
          New chats with your customers will show up here as soon as they start a session with you.
        </Text>
      </View>
    );
  };

  const connectionIndicator = isRealtimeConnected ? (
    <View className="flex-row items-center mt-3">
      <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: BUTTON_PRIMARY }} />
      <Text className={`text-xs font-poppins ${isDark ? 'text-textMuted' : 'text-textMuted'}`}>
        Live updates enabled
      </Text>
    </View>
  ) : null;

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <View className="flex-1 pt-12 pb-4">
        <View className="px-6 mb-4">
          <Text
            className={`text-3xl font-urbanist-bold mb-1 ${isDark ? 'text-textWhite' : 'text-textDark'}`}
          >
            Chats
          </Text>
          <Text className={`text-sm font-poppins ${isDark ? 'text-textMuted' : 'text-textMuted'}`}>
            Continue conversations and stay on top of every consultation.
          </Text>
          {connectionIndicator}

          <View
            className="flex-row items-center mt-4 rounded-2xl px-4"
            style={{
              backgroundColor: isDark ? '#0F241C' : '#F5F9F7',
              borderWidth: 1,
              borderColor,
            }}
          >
            <TextInput
              placeholder="Search clients or topics..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 py-3 font-poppins text-sm"
              style={{ color: textPrimary }}
            />
          </View>

          <View className="flex-row gap-3 mt-4">
            {(['all', 'unread'] as FilterKey[]).map((filter) => {
              const isActive = activeFilter === filter;
              const backgroundColor = isActive ? BUTTON_PRIMARY : 'transparent';
              const color = isActive ? '#0E1B16' : textMuted;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  className="px-4 py-2 rounded-full border"
                  style={{
                    borderColor,
                    backgroundColor,
                  }}
                >
                  <Text className="text-sm font-urbanist-semibold" style={{ color }}>
                    {filter === 'all' ? 'All' : 'Unread'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading && consultations.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={BUTTON_PRIMARY} />
            <Text className="mt-3 font-poppins text-sm" style={{ color: textMuted }}>
              Loading your conversations...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderConversation}
            contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 12 }}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={BUTTON_PRIMARY}
              />
            }
          />
        )}
      </View>
    </LinearGradient>
  );
};

export default ChatHome;
