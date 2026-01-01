import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useGetDisputeConsultations = () => {
  return useQuery({
    queryKey: ['dispute-consultations'],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');

      try {
        const res = await axios.get(`${BASE_URL}/api/customer/disputes/consultations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
