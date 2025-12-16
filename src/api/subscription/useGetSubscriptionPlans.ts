import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  monthly_price_formatted: string;
  discounted_price: number;
  discounted_price_formatted: string;
  discount_percentage: number;
  discount_duration_months: number;
  consultations_per_month: number;
  minimum_commitment_months: number;
  apple_product_id: string;
  google_product_id: string;
  stripe_product_id: string | null;
  stripe_price_id_intro: string | null;
  stripe_price_id_regular: string | null;
  sort_order: number;
}

interface SubscriptionPlansResponse {
  status: string;
  code: number;
  message: string;
  data: SubscriptionPlan[];
}

export const useGetSubscriptionPlans = () => {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      try {
        const res = await axios.get<SubscriptionPlansResponse>(
          `${BASE_URL}/api/subscriptions-plans`
        );

        return res.data.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
