import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { NewsArticle } from '@/common/types';

export const useGetNewsDetail = (slug: string) => {
  return useQuery<NewsArticle>({
    queryKey: ['news-detail', slug],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/news/articles/${slug}`);
      return res.data.data;
    },
  });
};
