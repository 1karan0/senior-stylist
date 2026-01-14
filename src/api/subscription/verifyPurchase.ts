import axios from 'axios';

import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import type { ProfileSubscription } from '@/common/types';

export type VerifyPurchasePlatform = 'android' | 'ios';

export interface VerifyPurchasePayload {
  userId: number;
  planId: number;
  platform: VerifyPurchasePlatform;
  transactionId: string;
  productId: string;
  base_plan_id?: string | null;
  purchaseDate: string | number | null;

  // Optional action hints for backend (e.g. deferred downgrades)
  action?: string | null;
  scheduledPlanId?: number | string | null;
  scheduledStartDate?: string | number | null;

  // Android-specific fields
  purchaseToken?: string | null;
  orderId?: string | null;
  packageName?: string | null;
  autoRenewing?: boolean | null;

  // iOS-specific fields
  transactionReceipt?: string | null;
  originalTransactionId?: string | null;
}

export interface VerifyPurchaseSuccessData {
  subscription: ProfileSubscription | Record<string, unknown>;
  payment_transaction: Record<string, unknown>;
  is_upgrade: boolean;
  is_re_verification: boolean;
}

export interface VerifyPurchaseResponse {
  status: 'success' | 'error';
  code: number;
  message: string;
  data?: VerifyPurchaseSuccessData;
}

/**
 * Verify an in-app purchase with the backend.
 *
 * This endpoint is used for:
 * - Initial subscription purchases
 * - Plan upgrades
 * - Explicit verification/re-verification flows
 *
 * NOTE:
 * - The backend uses the platform-specific fields (purchaseToken / transactionReceipt, etc.)
 *   to talk to Google Play or Apple App Store and confirm the entitlement.
 */
export const verifyPurchase = async (
  payload: VerifyPurchasePayload
): Promise<VerifyPurchaseResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw new Error('Auth token missing');
  }

  const url = `${BASE_URL}/api/subscriptions/verify-purchase`;

  const response = await axios.post<VerifyPurchaseResponse>(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};
