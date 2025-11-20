import { BASE_URL } from '@/config';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useSignupApi = () => {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; phone: string }) => {
      const res = await axios.post(`${BASE_URL}/api/signup`, data);
      return res.data; // return token + user
    },
  });
};
