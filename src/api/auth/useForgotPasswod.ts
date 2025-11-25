import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      try {
        const res = await axios.post(`${BASE_URL}/api/forgot-password`, data);
        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
