import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';

export const useGetPendingReviews = () => {
  return useQuery({
    queryKey: ['pending-reviews'],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      const res = await axios.get(`${BASE_URL}/api/customer/consultations/pending-reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('[useGetPendingReviews] API response:', res.data);
      // The API returns { data: { consultations: [...] } }
      // Extract the consultations array
      return res.data.data?.consultations || [];
    },
    enabled: true, // Always enable the query
    retry: 1, // Retry once on failure
  });
};
