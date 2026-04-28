import { BASE_URL } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { storage } from '@/services/storage';

export const useVerifyExistingPhone = () => {
  const { refreshAuthUser } = useAuth();

  return useMutation({
    mutationFn: async (firebase_id_token: string) => {
      try {
        const token = await storage.getToken();
        if (!token) throw new Error('Auth token missing');
        const res = await axios.post(
          `${BASE_URL}/api/customer/auth/verify-existing-phone`,
          {
            firebase_id_token,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
    onSuccess: async () => {
      await refreshAuthUser();
    },
  });
};
