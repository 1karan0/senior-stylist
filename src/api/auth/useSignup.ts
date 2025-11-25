import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useSignupApi = () => {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; phone: string }) => {
      try {
        const res = await axios.post(`${BASE_URL}/api/signup`, data);
        return res.data; // return token + user
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
