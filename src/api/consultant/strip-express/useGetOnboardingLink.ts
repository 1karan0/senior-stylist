import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

type UseGetOnboardingLinkOptions = {
  enabled?: boolean;
};

/**
 * Returns a Stripe onboarding link for an already-created Stripe Express account
 * (e.g. consultant wants to update account details).
 *
 * Use with `enabled: false` and call `refetch()` on button click, because Stripe links can be single-use.
 */
export const useGetOnboardingLink = (options: UseGetOnboardingLinkOptions = {}) => {
  const { enabled = false } = options;

  return useQuery({
    queryKey: ['onboarding-link'],
    enabled,
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Token not found');

      try {
        const res = await axios.get(`${BASE_URL}/api/stylist/stripe-express/onboarding-link`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
  });
};
