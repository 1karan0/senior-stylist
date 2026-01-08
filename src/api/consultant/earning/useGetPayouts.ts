import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export type PayoutStatus = 'all' | 'completed' | 'failed' | 'pending';

export interface UseGetPayoutsParams {
  status?: PayoutStatus;
  page?: number;
  per_page?: number;
}

export const useGetPayouts = (params?: UseGetPayoutsParams) => {
  const { status, page, per_page } = params || {};

  return useQuery({
    queryKey: ['payouts', status, page, per_page],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');

      // Map frontend status to API status
      // 'completed' -> 'paid', 'failed' -> 'failed', 'pending' -> 'pending'
      let apiStatus: string | undefined = status;
      if (status === 'completed') {
        apiStatus = 'paid';
      }

      const response = await axios.get(`${BASE_URL}/api/stylist/payouts`, {
        params: {
          status: apiStatus,
          page,
          per_page,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Return the full data object which contains pagination info
      return response.data.data;
    },
  });
};
