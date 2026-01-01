import { useQuery } from '@tanstack/react-query';
import { storage } from '@/services/storage';
import axios from 'axios';
import { BASE_URL } from '@/config';

export const useGetDisputes = () => {
  return useQuery({
    queryKey: ['disputes'],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      const response = await axios.get(`${BASE_URL}/api/customer/disputes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });
};
