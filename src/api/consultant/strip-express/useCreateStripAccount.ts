import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useCreateStripAccount = () => {
  return useMutation({
    mutationFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      try {
        const response = await axios.post(
          `${BASE_URL}/api/stylist/stripe-express/create-account`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
  });
};
