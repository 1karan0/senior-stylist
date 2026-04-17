import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useLoginWithPhone = () => {
  return useMutation({
    mutationFn: async (firebase_id_token: string) => {
      try {
        const res = await axios.post(`${BASE_URL}/api/customer/auth/login-phone-verify`, {
          firebase_id_token,
        });
        console.log(res.data);
        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
