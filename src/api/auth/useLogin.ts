import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '../../config';
import { parseApiError } from '@/utils/parseApiError';

export const useLoginApi = () => {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      try {
        const res = await axios.post(`${BASE_URL}/api/login`, data);
        return res.data; // return token + user
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
