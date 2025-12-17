import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { parseApiError } from '@/utils/parseApiError';

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: async () => {
      try {
        const token = await storage.getToken();

        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }

        const response = await axios.post(
          `${BASE_URL}/api/account/delete-request`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Many endpoints wrap the payload under `data`
        return response?.data?.data ?? response.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
  });
};
