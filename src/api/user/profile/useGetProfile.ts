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

        return {
          user: res.data.data.user,
          subscription: res.data.data.subscription || null,
        };
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
    ...options,
  });
};
