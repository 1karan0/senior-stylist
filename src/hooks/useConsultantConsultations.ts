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
import { filterByConsultant, mergeConsultations, sortByLatest } from '@/utils/consultationUtils';

const MAX_ITEMS = 40;

interface UseConsultantConsultationsOptions {
  consultantKey: string | null;
}

export const useConsultantConsultations = ({
  consultantKey,
}: UseConsultantConsultationsOptions) => {
  const [consultations, setConsultations] = useState<ConsultantConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRealtimeConnected, setRealtimeConnected] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initChatDatabase();
  }, []);

  const fetchFromFirestore = useCallback(async () => {
    if (!consultantKey) return [];

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
    if (!consultantKey) return;

    const firebaseUser = await waitForFirebaseUser(3000);
    if (!firebaseUser) return;

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
  }, [consultantKey]);

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
          const filtered = filterByConsultant(cached, consultantKey);
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
    [consultantKey, fetchFromApi, fetchFromFirestore]
  );

  const refreshConversations = useCallback(async () => {
    setRefreshing(true);
    await loadConversations(false);
    setRefreshing(false);
  }, [loadConversations]);

  useEffect(() => {
    loadConversations(true);
    subscribeToRealtime();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [loadConversations, subscribeToRealtime]);

  return {
    consultations,
    loading,
    refreshing,
    isRealtimeConnected,
    refreshConversations,
  };
};
