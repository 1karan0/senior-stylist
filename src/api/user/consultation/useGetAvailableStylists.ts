import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useGetAvailableStylists = () => {
  const token = storage.getToken();
  return useQuery({
    queryKey: ['available-stylists'],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Token not found');

      const response = await axios.get(`${BASE_URL}/api/consultants/online-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    },
    enabled: !!token,
  });
};
