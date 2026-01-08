import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface UseGetEarningHistoryParams {
  page?: number;
  per_page?: number;
  month?: number;
  year?: number;
}

export const useGetEarningHistory = (params?: UseGetEarningHistoryParams) => {
  const { page, per_page, month, year } = params || {};

  return useQuery({
    queryKey: ['earning-history', page, per_page, month, year],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      try {
        const response = await axios.get(`${BASE_URL}/api/stylist/earnings/history`, {
          params: {
            page,
            per_page,
            month,
            year,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        // Returning full payload preserves pagination metadata (if the API includes it).
        return response.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    placeholderData: (previousData) => previousData,
  });
};
