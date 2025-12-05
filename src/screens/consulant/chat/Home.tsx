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
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { consultantConsultationsApi, ConsultantConsultation } from '@/api/consultant/consultations';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { initializeFirebase, waitForFirebaseUser } from '@/services/firebase';

import { mapFirestoreConsultation } from '@/utils/firestoreConsultationMapper';
import {
  getCachedConsultations,
  initChatDatabase,
  saveConsultations,
} from '@/services/chatDatabase';
import type { AppStackParamList } from '@/common/types';
import GradientBackground from '@/common/components/GradientBackground';

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

const ChatHome: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();

  const consultantKey = useMemo(() => (user?.id ? String(user.id) : null), [user?.id]);

  const [consultations, setConsultations] = useState<ConsultantConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [isRealtimeConnected, setRealtimeConnected] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
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

    const snapshot = await firestore()
      .collection('consultations')
      .where('consultant_id', '==', consultantKey)
      .orderBy('last_message_at', 'desc')
      .limit(MAX_ITEMS)
      .get();

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

    const firebaseUser = await waitForFirebaseUser(3000);
    if (!firebaseUser) {
      return;
    }

    const realtimeQuery = firestore()
      .collection('consultations')
      .where('consultant_id', '==', consultantKey)
      .orderBy('last_message_at', 'desc')
      .limit(MAX_ITEMS);

    const unsubscribe = realtimeQuery.onSnapshot(
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

  const renderConversation = ({ item }: { item: ConversationPreview }) => {
    console.log(item, 'conversation item');
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleConversationPress(item)}
        className={`${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}  shadow-sm border  rounded-xl px-4 py-4 mb-2 flex-row items-center`}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} className="w-12 h-12 rounded-full mr-4" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-buttonPrimaryBg items-center justify-center mr-4">
            <Text className="text-white text-lg font-semibold">
              {getInitials(item.customerName)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className={`font-semibold text-base ${isDark ? 'text-white' : 'text-textDark'}  capitalize`}
              numberOfLines={1}
            >
              {item.customerName}
            </Text>
          </View>
          <Text
            className={` ${isDark ? 'text-textMuted' : 'text-textSecondary'}`}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>

        <View className="items-end ml-2">
          <Text
            className={` ${isDark ? 'text-textSecondary' : 'text-[#9EA3AE]'} font-medium text-xs`}
          >
            {formatRelativeTime(item.lastMessageAt)}
          </Text>
          {item.unreadCount > 0 && (
            <View
              className={`bg-buttonPrimaryBg w-6 h-6 rounded-full justify-center items-center mt-2`}
            >
              <Text className="text-white text-xs font-semibold">
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
      <View className="w-2 h-2 rounded-full mr-2" />
      <Text className={`text-xs font-poppins ${isDark ? 'text-textMuted' : 'text-textMuted'}`}>
        Live updates enabled
      </Text>
    </View>
  ) : null;

  // Keep these values in sync with your tab navigator
  const { paddingBottom } = useTabBarSafePadding();

  console.log(filteredConversations, 'filteredConversations');

  return (
    <GradientBackground className="flex-1">
      {/* apply paddingBottom so content doesn't get hidden under the absolute tab bar */}
      <View className="flex-1 pt-6 px-5" style={{ paddingBottom }}>
        <View className=" mb-4">
          <Text
            className={`text-2xl font-urbanist-bold mb-1 ${isDark ? 'text-textWhite' : 'text-textDark'}`}
          >
            Client Consultations
          </Text>
          {connectionIndicator}

          <View
            className={`flex-row items-center border mt-3 rounded-xl ${
              isDark
                ? 'bg-commonGradientStop6 border-commonGradientStop7'
                : 'bg-[#FAFAFA] border-[#E6E6E6]'
            }`}
            style={{
              paddingHorizontal: 12,
              minHeight: Platform.OS === 'ios' ? 32 : undefined,
              paddingVertical: Platform.OS === 'ios' ? 8 : 0,
            }}
          >
            <Image
              source={require('../../../assets/icons/search-icon.png')}
              className="w-5 h-5 mr-3"
            />

            <TextInput
              placeholder="Search clients or topics..."
              value={searchQuery}
              placeholderTextColor="#6D837A"
              onChangeText={setSearchQuery}
              className={`ml-2 flex-1 ${isDark ? 'text-white' : 'text-black'}`}
              style={{
                paddingVertical: Platform.OS === 'ios' ? 8 : 0,
                fontSize: 15,
                includeFontPadding: false,
              }}
            />
          </View>

          <View className="flex-row gap-3 mt-4">
            {(['all', 'unread'] as FilterKey[]).map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  className={`px-4 py-2  rounded-full border ${isDark ? 'border-commonGradientStop7' : 'border-commonGradientStop11'} ${isActive && 'bg-buttonPrimaryBg'}`}
                >
                  <Text
                    className={`text-sm font-urbanist-semibold ${isActive && 'text-white'} ${isDark ? 'text-white' : ''}`}
                  >
                    {filter === 'all' ? 'All' : 'Unread'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading && consultations.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" />
            <Text className="mt-3 font-poppins text-sm">Loading your conversations...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderConversation}
            contentContainerStyle={{ paddingBottom }} // <- critical change
            ListEmptyComponent={renderEmpty}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>
    </GradientBackground>
  );
};

export default ChatHome;
