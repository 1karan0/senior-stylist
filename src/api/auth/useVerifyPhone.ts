import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useVerifyPhone = () => {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone: string;
      phone_country_code: string;
      firebase_id_token: string;
      referral_code?: string;
    }) => {
      try {
        const res = await axios.post(`${BASE_URL}/api/customer/auth/signup-phone-verify`, data);
        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
