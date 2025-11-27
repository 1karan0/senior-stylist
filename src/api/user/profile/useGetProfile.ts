import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { storage } from '@/services/storage';
import { ProfileUser } from '@/common/types';

export const useGetProfile = () => {
  return useQuery<ProfileUser>({
    queryKey: ['profileData'],
    queryFn: async () => {
      try {
        const token = await storage.getToken();
        if (!token) throw new Error('Auth token missing');

        const res = await axios.get(`${BASE_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Device-Type': 'android',
            'X-App-Version': '1.0.0',
          },
        });

        return res.data.data.user;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
