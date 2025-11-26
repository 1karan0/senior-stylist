import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/config';

export const useGetStoreProducts = () => {
  return useMutation({
    mutationFn: async ({
      page = 1,
      search = '',
      category = '',
    }: {
      page?: number;
      search?: string;
      category?: string | null;
    }) => {
      const res = await axios.get(`${BASE_URL}/api/shop/products`, {
        params: {
          page,
          search: search || undefined,
          category_slug: category || undefined,
          per_page: 12,
        },
      });

      return {
        items: res.data?.data || [],
        pagination: res.data?.pagination,
      };
    },
  });
};
