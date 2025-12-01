import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useUploadProfilePicture = () => {
  return useMutation({
    mutationFn: async (profile_picture: any) => {
      try {
        const token = await storage.getToken();
        if (!token) throw new Error('Auth token missing');

        const formData = new FormData();
        formData.append('profile_picture', {
          uri: profile_picture.uri,
          name: profile_picture.name,
          type: profile_picture.type,
        });

        const res = await axios.post(`${BASE_URL}/api/profile/picture`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
