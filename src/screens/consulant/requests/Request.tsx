import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import type { Unsubscribe } from 'firebase/firestore';

import RequestDetailsModal from './DetailsModal';
import RequestList, { RequestItem } from './List';
import { consultantConsultationsApi, ConsultantConsultation } from '@/api/consultant/consultations';
import GradientBackground from '@/common/components/GradientBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { initializeFirebase, listenToStylistRequests, StylistRequest } from '@/services/firebase';

const mapConsultationToRequestItem = (consultation: ConsultantConsultation): RequestItem => {
  const customerName = consultation.user?.name || 'Unknown User';
  const requestedAt = new Date(consultation.requested_at).getTime();
  const expiresAt = consultation.expires_at ? new Date(consultation.expires_at).getTime() : null;

  return {
    id: consultation.id,
    customerName,
    problemDescription: consultation.problem_description || '',
    hasImage: Boolean(consultation.image_path),
    requestedAt,
    expiresAt: expiresAt ?? undefined,
  };
};

const mapFirebaseRequestToItem = (
  firebaseRequest: StylistRequest,
  consultationId: number
): RequestItem => {
  const customerName = firebaseRequest.customer_name || 'Unknown User';
  const requestedAt = firebaseRequest.sent_at ? firebaseRequest.sent_at * 1000 : Date.now();
  const expiresAt = firebaseRequest.expires_at ? firebaseRequest.expires_at * 1000 : undefined;

  return {
    id: consultationId,
    customerName,
    problemDescription: firebaseRequest.short_meta?.problem_description || '',
    hasImage: Boolean(firebaseRequest.short_meta?.has_image),
    requestedAt,
    expiresAt,
  };
};

const sortRequests = (requests: RequestItem[]) =>
  [...requests].sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));

const Request: React.FC = () => {
  const { user } = useAuth();
  const isConsultant = user?.role === 'consultant';
  const { isDark } = useTheme();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [requirementsModal, setRequirementsModal] = useState<RequestItem | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!user?.id || !isConsultant) {
      setLoading(false);
      return;
    }

    const bootstrap = async () => {
      try {
        await initializeFirebase();
      } catch (error) {
        if (__DEV__) {
          console.warn('Failed to initialize Firebase:', error);
        }
      }

      await loadInitialRequests({ silent: false });
      setupFirebaseListener(user.id);
    };

    bootstrap();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isConsultant]);

  const loadInitialRequests = async ({ silent }: { silent: boolean }) => {
    if (!user?.id || !isConsultant) {
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const consultations = await consultantConsultationsApi.available();
      const mapped = consultations.map(mapConsultationToRequestItem);
      setRequests(sortRequests(mapped));
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load consultation requests:', error);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const setupFirebaseListener = (stylistId: number) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsubscribe = listenToStylistRequests(stylistId, {
      onRequestAdded: async (firebaseRequest, requestId) => {
        const consultationId = Number(requestId);
        if (Number.isNaN(consultationId)) {
          return;
        }

        let consultation: ConsultantConsultation | null = null;
        try {
          consultation = await consultantConsultationsApi.get(consultationId);
        } catch (error) {
          if (__DEV__) {
            console.warn('Failed to fetch consultation details:', error);
          }
        }

        const normalized = consultation
          ? mapConsultationToRequestItem(consultation)
          : mapFirebaseRequestToItem(firebaseRequest, consultationId);

        setRequests((prev) => {
          const exists = prev.some((req) => req.id === normalized.id);
          if (exists) {
            return sortRequests(prev.map((req) => (req.id === normalized.id ? normalized : req)));
          }
          return sortRequests([normalized, ...prev]);
        });
      },
      onRequestRemoved: (requestId) => {
        const id = Number(requestId);
        setRequests((prev) => prev.filter((req) => req.id !== id));
      },
      onConnectionChange: (isConnected) => {
        setConnected(isConnected);
      },
      onError: (error) => {
        if (__DEV__) {
          console.error('Firebase listener error:', error);
        }
      },
    });

    if (unsubscribe) {
      unsubscribeRef.current = unsubscribe;
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    if (acceptingId) {
      return;
    }

    setAcceptingId(requestId);
    try {
      await consultantConsultationsApi.accept(requestId);
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      setRequirementsModal(null);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Failed to accept the consultation. It might have been assigned already.';
      Alert.alert('Unable to accept request', message);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialRequests({ silent: true });
    setRefreshing(false);
  };

  const handleViewDetails = (request: RequestItem) => {
    setRequirementsModal(request);
  };

  const handleCloseModal = () => {
    setRequirementsModal(null);
  };

  if (!isConsultant) {
    return (
      <View className="flex-1 bg-white p-6 justify-center items-center">
        <Text className="text-2xl font-urbanist font-bold text-textDark mb-4">Consultant Only</Text>
        <Text className="font-poppins text-center text-textMuted">
          You need a consultant account to view incoming requests.
        </Text>
      </View>
    );
  }

  return (
    <GradientBackground>
      <View className="flex-1 px-5 py-6">
        <View className="flex-col items-start">
          <Text
            className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
          >
            Consultation Requests
          </Text>
          {connected && (
            <View className="flex-row items-center mt-2">
              <View className="w-2 h-2 rounded-full bg-textPrimary mr-2" />
              <Text
                className={`font-poppins text-xs  ${isDark ? 'text-[#8AA897]' : 'text-textMuted'}`}
              >
                Real-time updates enabled
              </Text>
            </View>
          )}
        </View>

        <View>
          <View className="flex-row justify-between items-center mt-4">
            <View
              className={`flex-1 items-center rounded-xl border  p-4 mr-2 ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
            >
              <Text
                className={`text-3xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                {requests.length}
              </Text>
              <Text
                className={`font-poppins  text-sm mt-1 ${isDark ? 'text-[#8AA897]' : 'text-textMuted'}`}
              >
                Pending
              </Text>
            </View>
            <View
              className={`flex-1 items-center rounded-xl border  p-4 ml-2 ${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'}`}
            >
              <Text
                className={`text-3xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                0
              </Text>
              <Text className="font-poppins text-textMuted text-sm mt-1">This Month</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#27B07D" />
            <Text className="font-poppins text-sm text-textMuted mt-3">
              Loading consultation requests...
            </Text>
          </View>
        ) : (
          <RequestList
            requests={requests}
            onAcceptRequest={handleAcceptRequest}
            onViewDetails={handleViewDetails}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            acceptingId={acceptingId}
          />
        )}

        <RequestDetailsModal
          visible={Boolean(requirementsModal)}
          onClose={handleCloseModal}
          request={requirementsModal}
        />
      </View>
    </GradientBackground>
  );
};

export default Request;
