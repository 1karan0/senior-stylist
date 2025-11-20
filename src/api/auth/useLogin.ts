import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '../../config';

export const useLoginApi = () => {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await axios.post(`${BASE_URL}/api/login`, data);
      return res.data; // return token + user
    },
  });
};
