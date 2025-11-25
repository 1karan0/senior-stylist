import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useVerifyEmailApi = () => {
  return useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      try {
        const res = await axios.post(`${BASE_URL}/api/verify-email`, data);
        return res.data; // return success message or token
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
