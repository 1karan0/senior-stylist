import { BASE_URL } from '@/config';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useGetNewsCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/news/categories`);
      return res.data.data;
    },
  });
};
