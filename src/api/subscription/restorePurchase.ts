import axios from 'axios';

import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';

export type RestorePurchasePlatform = 'android' | 'ios';

export interface RestorePurchasePayload {
  purchaseToken: string | null;
  transactionId: string;
  platform: RestorePurchasePlatform;
}

export interface RestorePurchaseResponse {
  status: 'success' | 'error';
  code: number;
  message: string;
  data?: unknown;
}

/**
 * Restore an existing subscription entitlement for the current user.
 * Backend endpoint: POST /restore-purchase
 */
export const restorePurchase = async (
  payload: RestorePurchasePayload
): Promise<RestorePurchaseResponse> => {
  const token = await storage.getToken();
  if (!token) throw new Error('Auth token missing');

  const url = `${BASE_URL}/api/restore-purchase`;

  const response = await axios.post<RestorePurchaseResponse>(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};
