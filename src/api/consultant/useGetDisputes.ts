import { BASE_URL } from '@/config';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ConsultantDisputesApiResponse } from '@/common/types';
import { storage } from '@/services/storage';

interface UseGetConsultantDisputesParams {
  page?: number;
  per_page?: number;
}

export const useGetConsultantDisputes = (params?: UseGetConsultantDisputesParams) => {
  const { page = 1, per_page = 15 } = params || {};

  return useQuery<ConsultantDisputesApiResponse, Error>({
    queryKey: ['consultant-disputes', page, per_page],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');
      const response = await axios.get(`${BASE_URL}/api/consultant/disputes`, {
        params: {
          page,
          per_page,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data;
    },
  });
};
