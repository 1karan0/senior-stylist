import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/config';

export const useGetStoreCategories = () => {
  return useQuery({
    queryKey: ['storeCategories'],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/shop/categories`);
      return res.data?.data || [];
    },
  });
};
