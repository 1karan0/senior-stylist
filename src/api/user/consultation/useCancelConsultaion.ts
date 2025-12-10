import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useCancelConsultaion = () => {
  return useMutation({
    mutationFn: async (consultationId: string | number) => {
      try {
        const token = await storage.getToken();
        if (!token) throw new Error('Auth token missing');
        const response = await axios.post(
          `${BASE_URL}/api/customer/consultations/${consultationId}/cancel`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return response.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
