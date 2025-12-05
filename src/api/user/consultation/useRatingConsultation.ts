import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useRatingConsultation = () => {
  return useMutation({
    mutationFn: async ({
      consultationId,
      rating,
      user_feedback,
    }: {
      consultationId: string;
      rating: number;
      user_feedback: string;
    }) => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      try {
        const res = await axios.post(
          `${BASE_URL}/api/customer/consultations/${consultationId}/rate`,
          {
            id: consultationId,
            rating: rating,
            user_feedback: user_feedback,
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
