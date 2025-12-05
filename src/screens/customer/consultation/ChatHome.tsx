import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { initializeFirebase, waitForFirebaseUser } from '@/services/firebase';

import { consultantConsultationsApi, ConsultantConsultation } from '@/api/consultant/consultations';

import { mapFirestoreConsultation } from '@/utils/firestoreConsultationMapper';

import {
  getCachedConsultations,
  initChatDatabase,
  saveConsultations,
} from '@/services/chatDatabase';

import GradientBackground from '@/common/components/GradientBackground';
import ConversationSkeleton from '@/common/components/skeletons/ConversationSkeleton';
import type {
  AppStackParamList,
  ConsultationStackParamList,
  ConversationPreview,
} from '@/common/types';

const MAX_ITEMS = 40;
type NavParamList = AppStackParamList & ConsultationStackParamList;

const CustomerChatHome: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const navigation = useNavigation<NativeStackNavigationProp<NavParamList>>();

  const userKey = useMemo(() => (user?.id ? String(user.id) : null), [user?.id]);

  const [consultations, setConsultations] = useState<ConsultantConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRealtimeConnected, setRealtimeConnected] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // utils
  const getTimestampValue = useCallback((value?: string | null) => {
    if (!value) return 0;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? 0 : t;
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
    (oldData: ConsultantConsultation[], newData: ConsultantConsultation[]) => {
      const map = new Map<number, ConsultantConsultation>();
      oldData.forEach((i) => map.set(i.id, i));
      newData.forEach((i) => {
        const prev = map.get(i.id);
        map.set(i.id, { ...prev, ...i });
      });
      return Array.from(map.values());
    },
    []
  );

  const createPreview = useCallback(
    (c: ConsultantConsultation): ConversationPreview => ({
      id: c.id,
      title: c.consultant?.name || 'Unknown Consultant',
      avatarUrl: c.consultant?.profile_picture_url,
      lastMessage: c.last_message || c.problem_description || 'Tap to view conversation',
      lastMessageAt: c.last_message_at ?? c.requested_at,
      unreadCount: c.unread_count_user ?? 0,
    }),
    []
  );

  useEffect(() => {
    initChatDatabase();
  }, []);

  const filterByUser = useCallback(
    (list: ConsultantConsultation[]) =>
      userKey ? list.filter((c) => String(c.user_id ?? '') === userKey) : [],
    [userKey]
  );

  const fetchFromFirestore = useCallback(async () => {
    if (!userKey) return [];

    const snap = await firestore()
      .collection('consultations')
      .where('user_id', '==', userKey)
      .orderBy('last_message_at', 'desc')
      .limit(MAX_ITEMS)
      .get();

    return snap.docs.map((doc) => mapFirestoreConsultation(doc.id, doc.data()));
  }, [userKey]);

  const fetchFromApi = useCallback(async () => {
    try {
      const res = await consultantConsultationsApi.list();
      return userKey
        ? (res as ConsultantConsultation[]).filter((c) => String(c.user_id ?? '') === userKey)
        : [];
    } catch (err) {
      return [];
    }
  }, [userKey]);

  const subscribeRealtime = useCallback(async () => {
    if (!userKey) return;

    const firebaseUser = await waitForFirebaseUser(3000);
    if (!firebaseUser) return;

    const q = firestore()
      .collection('consultations')
      .where('user_id', '==', userKey)
      .orderBy('last_message_at', 'desc')
      .limit(MAX_ITEMS);

    const unsub = q.onSnapshot(
      (snap) => {
        const docs = snap.docs.map((d) => mapFirestoreConsultation(d.id, d.data()));

        const realtimeIds = new Set(docs.map((d) => d.id));
        setRealtimeConnected(!snap.metadata.fromCache);

        setConsultations((prev) => {
          const stale = prev.filter((x) => !realtimeIds.has(x.id));
          return sortByLatest(mergeConsultations(stale, docs));
        });

        saveConsultations(docs).catch(() => {});
      },
      () => setRealtimeConnected(false)
    );

    unsubscribeRef.current = unsub;
  }, [mergeConsultations, sortByLatest, userKey]);

  const loadConversations = useCallback(
    async (withLoader: boolean) => {
      if (!userKey) return setLoading(false);

      if (withLoader) setLoading(true);

      await initializeFirebase();

      try {
        const cached = await getCachedConsultations();
        const filtered = filterByUser(cached);
        if (filtered.length) {
          setConsultations(sortByLatest(filtered));
        }
      } catch {}

      try {
        const fsData = await fetchFromFirestore();
        if (fsData.length) {
          await saveConsultations(fsData);
          setConsultations(sortByLatest(fsData));
        } else {
          const apiData = await fetchFromApi();
          await saveConsultations(apiData);
          setConsultations(sortByLatest(apiData));
        }
      } finally {
        if (withLoader) setLoading(false);
      }
    },
    [userKey, fetchFromFirestore, fetchFromApi, filterByUser, sortByLatest]
  );

  useEffect(() => {
    loadConversations(true);
    subscribeRealtime();

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [loadConversations, subscribeRealtime]);

  const previews: ConversationPreview[] = useMemo(
    () => consultations.map((c) => createPreview(c)),
    [consultations, createPreview]
  );

  const filteredConvos = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return previews;
    return previews.filter(
      (p) => p.title.toLowerCase().includes(term) || p.lastMessage.toLowerCase().includes(term)
    );
  }, [previews, searchQuery]);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((x) => x.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);

  const getRelative = (ts?: string | null) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const renderItem = ({ item }: { item: ConversationPreview }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('ConsultantChat', {
            consultationId: item.id,
            asCustomer: true,
          })
        }
        className={`${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}  shadow-sm border  rounded-xl px-4 py-4 mb-2 flex-row items-center`}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} className="w-12 h-12 rounded-full mr-4" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-buttonPrimaryBg items-center justify-center mr-4">
            <Text className="text-white text-lg font-semibold">{getInitials(item.title)}</Text>
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className={`font-semibold text-base ${isDark ? 'text-white' : 'text-textDark'}  capitalize`}
              numberOfLines={1}
            >
              {item.title}
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
            {getRelative(item.lastMessageAt)}
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

  return (
    <GradientBackground className="flex-1">
      <View className="flex-1 pb-20">
        {/* HEADER */}
        <View className="px-5 pt-6">
          <View className="flex-row justify-between items-center ">
            <Text
              className={` ${isDark ? 'text-white' : 'text-textDark'} text-2xl font-urbanist font-bold`}
            >
              Consultations
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('NewConsultant')}
              className="bg-yellow-300 px-4 py-2 rounded-full"
            >
              <Text className="font-semibold text-green-700">+ New</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View
            className={`flex-row items-center border mt-5 rounded-xl ${
              isDark
                ? 'bg-commonGradientStop6 border-commonGradientStop7'
                : 'bg-[#FAFAFA] border-[#E6E6E6]'
            }`}
            style={{
              paddingHorizontal: 12,
              minHeight: Platform.OS === 'ios' ? 36 : undefined,
              paddingVertical: Platform.OS === 'ios' ? 8 : 0,
            }}
          >
            <Image
              source={require('../../../assets/icons/search-icon.png')}
              className="w-5 h-5 mr-3"
            />
            <TextInput
              placeholder="Search conversations..."
              placeholderTextColor="#6D837A"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className={`ml-2 flex-1 ${isDark ? 'text-white' : 'text-black'}`}
              style={{
                paddingVertical: Platform.OS === 'ios' ? 8 : 0,
                fontSize: 15,
                includeFontPadding: false,
              }}
            />
          </View>
          <Text className={` mt-2 text-[11px] ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}>
            {isRealtimeConnected
              ? 'Connected to live updates'
              : 'Showing last synced conversations'}
          </Text>
        </View>

        {/* LIST */}
        {loading && consultations.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#27B07D" />
            <Text className="mt-3 text-sm text-white/80">Loading your conversations...</Text>
          </View>
        ) : (
          <View className="flex-1 px-5 mb-4 mt-4 ">
            <FlatList
              data={filteredConvos}
              keyExtractor={(i) => i.id.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadConversations(false);
                setRefreshing(false);
              }}
              ListEmptyComponent={() => (
                <View className="flex-1 items-center justify-center mt-14 px-10">
                  <Text className={` ${isDark ? 'text-white' : 'text-textMuted'} text-base mb-1`}>
                    No consultations yet
                  </Text>
                  <Text
                    className={`${isDark ? 'text-white' : 'text-textMuted'} text-xs text-center`}
                  >
                    Start a new consultation to begin chatting with a stylist.
                  </Text>
                </View>
              )}
            />
          </View>
        )}
      </View>
    </GradientBackground>
  );
};

export default CustomerChatHome;
