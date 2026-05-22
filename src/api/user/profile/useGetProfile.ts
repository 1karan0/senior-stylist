import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import axios from 'axios';
import { storage } from '@/services/storage';
import { ProfileUser, ProfileSubscription } from '@/common/types';
import { Platform } from 'react-native';

export interface ProfileResponse {
  user: ProfileUser;
  subscription: ProfileSubscription | null;
}

type UseGetProfileOptions = Omit<UseQueryOptions<ProfileResponse>, 'queryKey' | 'queryFn'>;

/** Normalize GET /api/profile — backends may nest user under `data` or expose it flat. */
function parseProfilePayload(body: unknown): ProfileResponse {
  if (body === null || typeof body !== 'object') {
    throw new Error('Invalid profile response body');
  }
  const root = body as Record<string, unknown>;

  // Typical: { status, message, data: { user, subscription } }
  const nested = root.data;
  if (nested && typeof nested === 'object') {
    const d = nested as Record<string, unknown>;
    if (d.user != null && typeof d.user === 'object') {
      return {
        user: d.user as ProfileUser,
        subscription: (d.subscription ?? null) as ProfileSubscription | null,
      };
    }
    // Some APIs return user fields directly inside `data` (no nested `user` key)
    if ('id' in nested && typeof (nested as Record<string, unknown>).email === 'string') {
      return {
        user: nested as ProfileUser,
        subscription: (root.subscription ?? null) as ProfileSubscription | null,
      };
    }
  }

  // Flat envelope: axios body is { user, subscription }
  if (root.user != null && typeof root.user === 'object') {
    return {
      user: root.user as ProfileUser,
      subscription: (root.subscription ?? null) as ProfileSubscription | null,
    };
  }

  throw new Error('Profile response missing user');
}

export const useGetProfile = (options?: UseGetProfileOptions) => {
  return useQuery<ProfileResponse>({
    queryKey: ['profileData'],
    queryFn: async () => {
      try {
        const token = await storage.getToken();
        if (!token) throw new Error('Auth token missing');

        const res = await axios.get(`${BASE_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Device-Type': Platform.OS,
            'X-App-Version': '1.0.0',
          },
        });

        return parseProfilePayload(res.data);
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
    ...options,
  });
};
