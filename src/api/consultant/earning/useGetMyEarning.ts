import { BASE_URL } from '@/config';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';

export const useGetMyEarning = () => {
  return useQuery({
    queryKey: ['get-my-earning'],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      try {
        const response = await axios.get(`${BASE_URL}/api/stylist/earnings`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
  });
};
