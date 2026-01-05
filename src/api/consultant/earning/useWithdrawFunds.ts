import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useWithdrawFunds = () => {
  return useMutation({
    mutationFn: async (amount: number) => {
      const token = await storage.getToken();
      if (!token) throw new Error('Token not found');

      try {
        const res = await axios.post(
          `${BASE_URL}/api/stylist/withdraw`,
          {
            amount: amount,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return res.data.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
