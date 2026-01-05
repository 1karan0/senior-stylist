import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useGetEarningStatementSummary = (taxYear: string) => {
  return useQuery({
    queryKey: ['statement-summary', taxYear],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Token not found');

      const res = await axios.get(
        `${BASE_URL}/api/stylist/statements/summary?tax_year=${taxYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data.data;
    },
    enabled: !!taxYear,
  });
};
