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
import type { AppStackParamList, ConsultationStackParamList } from '@/common/types';

type ConversationPreview = {
  id: number;
  title: string;
  avatarUrl?: string | null;
  lastMessage: string;
  lastMessageAt?: string | null;
  unreadCount: number;
};

const MAX_ITEMS = 40;

type NavParamList = AppStackParamList & ConsultationStackParamList;

/**
 * IMPORTANT: Keep these literal values in sync with your tailwind.config.js
 * (colors and fonts declared there). These literals are only used for runtime
 * props that require strings (gradients, placeholderTextColor, ActivityIndicator color).
 */
const LIGHT_BG = ['hsl(146 25% 97%)', 'hsl(158 64% 95%)'];
const DARK_BG = ['hsl(158 32% 8%)', 'hsl(158 32% 12%)'];

const TEXT_MUTED = '#658176'; // matches tailwind textMuted
const TEXT_DARK = '#162721'; // matches tailwind textDark
const TEXT_WHITE = '#FFFFFF'; // matches tailwind textWhite
const BUTTON_PRIMARY = '#27B07D'; // matches tailwind buttonPrimaryBg
const SURFACE_DARK = 'rgba(14,27,22,0.85)'; // used previously for dark surface fallback
const BORDER_LIGHT = '#DAE7E0'; // matches earlier border for light
const BORDER_DARK = '#273F36'; // matches earlier border for dark

const CustomerChatHome: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NavParamList>>();

  const userKey = useMemo(() => (user?.id ? String(user.id) : null), [user?.id]);

  const [consultations, setConsultations] = useState<ConsultantConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRealtimeConnected, setRealtimeConnected] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // gradient colors (used by LinearGradient)
  const gradientColors = isDark ? DARK_BG : LIGHT_BG;

  // surface / border / text values used when inline style string is required
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
      title: consultation.consultant?.name || 'Unknown Consultant',
      avatarUrl: consultation.consultant?.profile_picture_url,
      lastMessage:
        consultation.last_message || consultation.problem_description || 'Tap to view conversation',
      lastMessageAt: consultation.last_message_at ?? consultation.requested_at,
      unreadCount: consultation.unread_count_user ?? 0,
    }),
    []
  );

  useEffect(() => {
    initChatDatabase();
  }, []);

  const filterByUser = useCallback(
    (items: ConsultantConsultation[]) =>
      userKey ? items.filter((item) => String(item.user_id ?? '') === userKey) : [],
    [userKey]
  );

  const fetchFromFirestore = useCallback(async () => {
    if (!userKey) {
      return [];
    }
    const firestore = getFirestoreInstance();
    if (!firestore) {
      return [];
    }

    const baseQuery = query(
      collection(firestore, 'consultations'),
      where('user_id', '==', userKey),
      orderBy('last_message_at', 'desc'),
      firestoreLimit(MAX_ITEMS)
    );

    const snapshot = await getDocs(baseQuery);
    return snapshot.docs.map((doc) => mapFirestoreConsultation(doc.id, doc.data()));
  }, [userKey]);

  const fetchFromApi = useCallback(async () => {
    try {
      const response = await consultantConsultationsApi.list();
      // For the customer, we only want consultations where this user is the customer
      return userKey
        ? (response as ConsultantConsultation[]).filter(
            (item) => String(item.user_id ?? '') === userKey
          )
        : [];
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch consultations via API (customer):', error);
      }
      return [];
    }
  }, [userKey]);

  const subscribeToRealtime = useCallback(async () => {
    if (!userKey) {
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
      where('user_id', '==', userKey),
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
              console.warn('[customer-chat] failed to cache realtime consultations', error);
            }
          });
        }
      },
      (error) => {
        if (__DEV__) {
          console.error('Customer chat realtime listener error:', error);
        }
        setRealtimeConnected(false);
      }
    );

    unsubscribeRef.current = unsubscribe;
  }, [mergeConsultations, sortByLatest, userKey]);

  const loadConversations = useCallback(
    async (showLoader: boolean) => {
      if (!userKey) {
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
          const filtered = filterByUser(cached);
          if (filtered.length) {
            setConsultations(sortByLatest(filtered));
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[customer-chat] failed to load cached consultations', error);
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
    [fetchFromApi, fetchFromFirestore, filterByUser, sortByLatest, userKey]
  );

  useEffect(() => {
    loadConversations(true);
    subscribeToRealtime();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [loadConversations, subscribeToRealtime]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations(false);
    setRefreshing(false);
  }, [loadConversations]);

  const handleConversationPress = (conversation: ConversationPreview) => {
    navigation.navigate('ConsultantChat', { consultationId: conversation.id, asCustomer: true });
  };

  const getRelativeTime = (timestamp?: string | null) => {
    if (!timestamp) return '';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diffMs / 60000);
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

  const previews: ConversationPreview[] = useMemo(
    () => consultations.map((c) => createPreview(c)),
    [consultations, createPreview]
  );

  const filteredConversations = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return previews;
    return previews.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(term) ||
        conversation.lastMessage.toLowerCase().includes(term)
    );
  }, [previews, searchQuery]);

  const renderConversation = ({ item }: { item: ConversationPreview }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleConversationPress(item)}
      className={`flex-row items-center mb-4 px-4 py-3 rounded-2xl ${
        isDark ? 'bg-bgDark0 border border-bgDark1' : 'bg-white border border-bgLight1'
      }`}
      style={{
        // fallback surface + border colors for anything that needs inline strings
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
            {getInitials(item.title)}
          </Text>
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text
            className={`font-urbanist-semibold text-base ${isDark ? 'text-textWhite' : 'text-textDark'}`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            className={`text-xs font-urbanist-regular ${isDark ? 'text-textMuted' : 'text-textMuted'}`}
          >
            {getRelativeTime(item.lastMessageAt)}
          </Text>
        </View>
        <Text
          className={`text-xs font-urbanist-regular ${isDark ? 'text-textMuted' : 'text-textMuted'}`}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>

      {item.unreadCount > 0 && (
        <View className="ml-3 min-w-[24px] h-6 rounded-full px-2 items-center justify-center bg-buttonPrimaryBg">
          <Text className="text-xs font-urbanist-semibold text-white">
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
      <View className="flex-1 items-center justify-center mt-16 px-8">
        <Text
          className={`font-urbanist-regular text-base text-center mb-1 ${isDark ? 'text-textWhite' : 'text-textDark'}`}
        >
          No consultations yet
        </Text>
        <Text
          className={`font-urbanist-regular text-xs text-center ${isDark ? 'text-textMuted' : 'text-textMuted'}`}
        >
          Start a new consultation to begin chatting with a stylist.
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <View className="flex-1 pt-14 pb-4">
        <View className="px-5 mb-4">
          <View className="flex-row justify-between items-center mb-1">
            <View>
              <Text className="font-urbanist-bold text-2xl text-textWhite">Consultations</Text>
              <Text className="font-urbanist-regular text-xs text-white/80">
                Manage your styling sessions
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('NewConsultant')}
              className="bg-yellow-300 px-4 py-2 rounded-full"
              activeOpacity={0.85}
            >
              <Text className="font-urbanist-semibold text-sm text-green-700">+ New</Text>
            </TouchableOpacity>
          </View>

          <View
            className={`mt-4 flex-row items-center px-3 py-2 rounded-2xl border ${isDark ? 'bg-bgDark0 border-bgDark1' : 'bg-white border-bgLight1'}`}
          >
            <Image source={require('@/assets/icons/search-icon.png')} className="w-5 h-5 mr-3" />
            <TextInput
              placeholder="Search conversations..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 font-urbanist-regular text-sm"
              style={{ color: textPrimary }}
            />
          </View>

          {isRealtimeConnected ? (
            <Text className="mt-2 text-[11px] font-urbanist-regular" style={{ color: textMuted }}>
              Connected to live updates
            </Text>
          ) : (
            <Text className="mt-2 text-[11px] font-urbanist-regular" style={{ color: textMuted }}>
              Showing last synced conversations
            </Text>
          )}
        </View>

        {loading && consultations.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={BUTTON_PRIMARY} />
            <Text className="mt-3 font-urbanist-regular text-sm" style={{ color: textMuted }}>
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
                onRefresh={handleRefresh}
                tintColor={BUTTON_PRIMARY}
              />
            }
          />
        )}
      </View>
    </LinearGradient>
  );
};

export default CustomerChatHome;
