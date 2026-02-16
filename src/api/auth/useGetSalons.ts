import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useGetSalons = () => {
  return useQuery({
    queryKey: ['salons'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/salons`, {});
        return res.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
  });
};
