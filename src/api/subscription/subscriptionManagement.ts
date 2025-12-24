import axios from 'axios';
import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { storage } from '@/services/storage';

export interface CurrentSubscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  platform: 'android' | 'ios';
  product_id: string;
  base_plan_id?: string | null;
  transaction_id: string;
  expires_at: string | null;
  cancelled_at: string | null;
  auto_renewing: boolean;
  created_at: string;
  updated_at: string;
  plan?: {
    id: number;
    name: string;
    slug: string;
    monthly_price: number;
  };
}

export interface GetCurrentSubscriptionResponse {
  status: 'success' | 'error';
  code: number;
  message: string;
  data: {
    subscription: CurrentSubscription | null;
  };
}

export interface CancelSubscriptionResponse {
  status: 'success' | 'error';
  code: number;
  message: string;
  data: {
    subscription: CurrentSubscription;
  };
}

/**
 * Get current active subscription for the user
 * GET /api/subscriptions/current
 */
export const getCurrentSubscription = async (): Promise<CurrentSubscription | null> => {
  try {
    const token = await storage.getToken();
    if (!token) {
      throw new Error('Authentication token missing');
    }

    const res = await axios.get<GetCurrentSubscriptionResponse>(
      `${BASE_URL}/api/subscriptions/current`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data.data.subscription;
  } catch (err: any) {
    // If 404, user has no subscription
    if (err.response?.status === 404) {
      return null;
    }
    throw new Error(parseApiError(err));
  }
};

/**
 * Cancel current subscription
 * POST /api/subscriptions/cancel
 */
export const cancelSubscription = async (): Promise<CancelSubscriptionResponse> => {
  try {
    const token = await storage.getToken();
    if (!token) {
      throw new Error('Authentication token missing');
    }

    const res = await axios.post<CancelSubscriptionResponse>(
      `${BASE_URL}/api/subscriptions/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data;
  } catch (err) {
    throw new Error(parseApiError(err));
  }
};
