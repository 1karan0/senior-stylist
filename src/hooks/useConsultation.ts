import { useCallback, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { ConsultantConsultation, consultantConsultationsApi } from '@/api/consultant/consultations';
import { customerConsultationsApi } from '@/api/customer/consultations';
import { getCachedConsultation, initChatDatabase, saveConsultation } from '@/services/chatDatabase';

interface UseConsultationOptions {
  consultationId: number;
  isConsultant: boolean;
}

export const useConsultation = ({ consultationId, isConsultant }: UseConsultationOptions) => {
  const [consultation, setConsultation] = useState<ConsultantConsultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineError, setOfflineError] = useState<string | null>(null);

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
        const response = await customerConsultationsApi.get(consultationId);
        const latest = response.data?.consultation;
        if (latest) {
          setConsultation(latest);
          await saveConsultation(latest);
        } else if (!cached) {
          setOfflineError('Unable to load consultation details.');
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[chat] failed to load consultation', error);
        console.error('[chat] Error details:', {
          consultationId,
          isConsultant,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          message: error?.message,
          url: error?.config?.url,
        });
      }
      const cached = await getCachedConsultation(consultationId);
      if (cached) {
        setConsultation(cached);
        setOfflineError('Unable to refresh consultation. Showing cached data.');
      } else {
        if (error?.response?.status === 404) {
          setOfflineError(
            'Consultation not found. It may have been deleted or you may not have access.'
          );
        } else {
          setOfflineError('Unable to load consultation.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [consultationId, isConsultant, isOnline]);

  useEffect(() => {
    loadConsultation();
  }, [loadConsultation]);

  return {
    consultation,
    loading,
    isOnline,
    offlineError,
    reloadConsultation: loadConsultation,
  };
};
