import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useFinishConsultation = () => {
  return useMutation({
    mutationFn: async (consultationId: string) => {
      // Simulate API call to finish consultation
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      try {
        const res = await axios.post(
          `${BASE_URL}/api/customer/consultations/${consultationId}/complete`,
          {
            id: consultationId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
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
