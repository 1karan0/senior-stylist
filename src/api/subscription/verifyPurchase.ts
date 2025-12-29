import axios from 'axios';
import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';
import { storage } from '@/services/storage';

export interface VerifyPurchasePayload {
  userId: number;
  planId: number;
  platform: 'android' | 'ios';
  transactionId: string;
  productId: string;
  base_plan_id?: string | null; // Google Play base plan ID (base, pro, premium)
  purchaseDate?: string | number | null;
  purchaseToken?: string | null;
  orderId?: string | null;
  packageName?: string | null;
  autoRenewing?: boolean | null;
  transactionReceipt?: string | null;
  originalTransactionId?: string | null;
  // Optional fields for deferred downgrade handling
  action?: 'deferred_downgrade' | 'upgrade' | 'downgrade' | 'initial';
  scheduledPlanId?: string | null;
  scheduledStartDate?: string | number | null;
}

export interface VerifyPurchaseResponseData {
  subscription: any;
  payment_transaction: any;
  is_upgrade: boolean;
}

export interface VerifyPurchaseResponse {
  status: 'success' | 'error';
  code: number;
  message: string;
  data: VerifyPurchaseResponseData;
}

/**
 * Call backend to verify a purchase and activate subscription.
 * POST /api/subscriptions/verify-purchase
 */
export const verifyPurchase = async (
  payload: VerifyPurchasePayload
): Promise<VerifyPurchaseResponse> => {
  try {
    const token = await storage.getToken();
    if (!token) {
      throw new Error('Authentication token missing');
    }

    const res = await axios.post<VerifyPurchaseResponse>(
      `${BASE_URL}/api/subscriptions/verify-purchase`,
      payload,
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
