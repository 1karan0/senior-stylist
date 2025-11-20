import { BASE_URL } from '@/config';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useResendVerificationCodeApi = () => {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await axios.post(`${BASE_URL}/api/resend-verification-code`, data);
      return res.data;
    },
  });
};
