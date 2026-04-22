import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { storage } from '@/services/storage';

export const useSendEmailVerification = () => {
  return useMutation({
    mutationFn: async () => {
      try {
        const token = await storage.getToken();
        if (!token) throw new Error('Auth token missing');
        const response = await axios.post(
          `${BASE_URL}/api/sent-email-verification`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return response.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
  });
};
