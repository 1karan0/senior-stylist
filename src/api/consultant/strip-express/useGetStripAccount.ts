import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useGetStripAccount = () => {
  return useQuery({
    queryKey: ['strip-account'],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      const response = await axios.get(`${BASE_URL}/api/stylist/stripe-express/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    },
  });
};
