import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { NewsArticle } from '@/common/types';

export const useGetNewsArticles = () => {
  return useQuery<NewsArticle[]>({
    queryKey: ['news-articles'],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/news/articles`, {});
      return res.data?.data || [];
    },
  });
};
