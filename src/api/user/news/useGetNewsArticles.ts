import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { NewsArticle } from '@/common/types';

interface PaginationResponse {
  items: NewsArticle[];
  pagination: {
    current_page: number;
    last_page: number;
    has_more: boolean;
  };
}

export const useGetNewsArticles = () => {
  return useMutation<PaginationResponse, Error, number>({
    mutationFn: async (page: number) => {
      const res = await axios.get(`${BASE_URL}/api/news/articles?page=${page}`);

      return {
        items: res.data?.data || [],
        pagination: res.data?.pagination,
      };
    },
  });
};
