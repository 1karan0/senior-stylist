import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { consultantConsultationsApi, ConsultantConsultation } from '@/api/consultant/consultations';
import { mapFirestoreConsultation } from '@/utils/firestoreConsultationMapper';
import {
  getCachedConsultations,
  initChatDatabase,
  saveConsultations,
} from '@/services/chatDatabase';
import { initializeFirebase, waitForFirebaseUser } from '@/services/firebase';
import { filterByUser, mergeConsultations, sortByLatest } from '@/utils/consultationUtils';

const MAX_ITEMS = 40;

interface UseConsultationsOptions {
  userKey: string | null;
}

export const useConsultations = ({ userKey }: UseConsultationsOptions) => {
  const [consultations, setConsultations] = useState<ConsultantConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRealtimeConnected, setRealtimeConnected] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initChatDatabase();
  }, []);

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
  }, [userKey]);

  const loadConversations = useCallback(
    async (withLoader: boolean) => {
      if (!userKey) return setLoading(false);

      if (withLoader) setLoading(true);

      await initializeFirebase();

      try {
        const cached = await getCachedConsultations();
        const filtered = filterByUser(cached, userKey);
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
    [userKey, fetchFromFirestore, fetchFromApi]
  );

  const refreshConversations = useCallback(async () => {
    setRefreshing(true);
    await loadConversations(false);
    setRefreshing(false);
  }, [loadConversations]);

  useEffect(() => {
    loadConversations(true);
    subscribeRealtime();

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [loadConversations, subscribeRealtime]);

  return {
    consultations,
    loading,
    refreshing,
    isRealtimeConnected,
    refreshConversations,
  };
};
