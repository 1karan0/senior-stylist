import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useEditProfile = () => {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      address: string;
      profile_picture_url: string;
      phone: string;
      password?: string;
      bio?: string;
    }) => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');

      try {
        const res = await axios.put(`${BASE_URL}/api/profile`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
