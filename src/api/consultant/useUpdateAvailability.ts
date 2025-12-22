import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { storage } from '@/services/storage';

export interface UpdateAvailabilityRequest {
  is_away: boolean;
}

export interface UpdateAvailabilityResponse {
  status: string;
  code: number;
  message: string;
  data: {
    is_away: boolean;
    away_since: string | null;
  };
}

export const useUpdateAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateAvailabilityResponse,
    Error,
    UpdateAvailabilityRequest,
    { previousProfile: unknown }
  >({
    mutationFn: async (payload: UpdateAvailabilityRequest) => {
      try {
        const token = await storage.getToken();
        if (!token) throw new Error('Auth token missing');

        const res = await axios.put<UpdateAvailabilityResponse>(
          `${BASE_URL}/api/profile/availability`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'X-Device-Type': 'android',
              'X-App-Version': '1.0.0',
            },
          }
        );

        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
    onMutate: async (payload) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['profileData'] });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(['profileData']);

      // Optimistically update the cache
      queryClient.setQueryData(['profileData'], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return {
          ...old,
          is_away: payload.is_away,
          away_since: payload.is_away ? new Date().toISOString() : null,
        };
      });

      // Return context with the snapshotted value
      return { previousProfile };
    },
    onError: (err, payload, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(['profileData'], context.previousProfile);
      }
    },
    onSuccess: (data) => {
      // Update with the actual response data
      queryClient.setQueryData(['profileData'], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return {
          ...old,
          is_away: data.data.is_away,
          away_since: data.data.away_since,
        };
      });
      // Also invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['profileData'] });
    },
  });
};
