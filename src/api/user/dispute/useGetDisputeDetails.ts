import { useQuery } from '@tanstack/react-query';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import axios from 'axios';
import { BASE_URL } from '@/config';

export const useGetDisputeDetails = (disputeId: number | null) => {
  return useQuery({
    queryKey: ['dispute-details', disputeId],
    queryFn: async () => {
      if (!disputeId) throw new Error('Dispute ID is required');
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      try {
        const res = await axios.get(`${BASE_URL}/api/customer/disputes/${disputeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
    enabled: !!disputeId,
  });
};
