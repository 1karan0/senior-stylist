import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useSendDisputeMessage = () => {
  return useMutation({
    mutationFn: async (data: { id: number; message: string }) => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      try {
        const res = await axios.post(
          `${BASE_URL}/api/customer/disputes/${data.id}/messages`,
          {
            message: data.message,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
