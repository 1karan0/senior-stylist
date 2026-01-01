import { storage } from '@/services/storage';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';

export const useCreateDispute = () => {
  return useMutation({
    mutationFn: async (data: { consultation_id: string; description: string }) => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');

      try {
        const res = await axios.post(`${BASE_URL}/api/customer/disputes`, data, {
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
