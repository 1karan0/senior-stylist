import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';

type UseGetConsultationOptions = Omit<
  UseQueryOptions<unknown[]>,
  'queryKey' | 'queryFn' | 'placeholderData'
>;

export const useGetConsultation = (options?: UseGetConsultationOptions) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['consultations'],
    placeholderData: () => queryClient.getQueryData(['consultations']),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');

      const res = await axios.get(`${BASE_URL}/api/customer/consultations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return res.data?.data?.consultations || [];
    },
    ...options,
  });
};
