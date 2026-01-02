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
  const token = await storage.getToken();
  if (!token) {
    throw new Error('Authentication token missing');
  }

  const mask = (value: unknown, keepStart = 6, keepEnd = 4) => {
    const s = value === undefined || value === null ? '' : String(value);
    if (!s) return '';
    if (s.length <= keepStart + keepEnd + 3) return s;
    return `${s.slice(0, keepStart)}…${s.slice(-keepEnd)}`;
  };

  const sanitizePayloadForLog = (obj: any) => {
    try {
      const copy = { ...(obj || {}) };
      // redact/truncate sensitive or huge fields
      if ('purchase_token' in copy) copy.purchase_token = mask(copy.purchase_token, 6, 6);
      if ('transaction_receipt' in copy)
        copy.transaction_receipt = mask(copy.transaction_receipt, 10, 6);
      if ('original_transaction_id' in copy)
        copy.original_transaction_id = mask(copy.original_transaction_id, 6, 6);
      if ('transaction_id' in copy) copy.transaction_id = mask(copy.transaction_id, 6, 6);
      if ('order_id' in copy) copy.order_id = mask(copy.order_id, 6, 6);
      return copy;
    } catch {
      return { payload: '[unserializable]' };
    }
  };

  // Backend is Laravel-style and commonly validates snake_case fields.
  // Send snake_case aliases (and ensure "string" fields are never null).
  const toStringOrEmpty = (v: unknown) => (v === undefined || v === null ? '' : String(v));
  const toStringOrEmptySafe = (v: unknown) => {
    if (v === undefined || v === null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  // IMPORTANT:
  // For Android verification we only need purchaseToken + product/base_plan + user/plan IDs.
  // Do NOT send orderId/originalTransactionId/packageName/autoRenewing/receipt for Android.
  // NOTE: Our backend currently validates `platform`, `transactionId` and/or `transaction_id` as required.
  const basePayloadForApi: any =
    payload.platform === 'android'
      ? {
          // camelCase (some backends validate these exact keys)
          userId: payload.userId,
          planId: payload.planId,
          platform: payload.platform,
          transactionId: toStringOrEmptySafe(payload.transactionId),
          productId: toStringOrEmpty(payload.productId),
          purchaseDate: payload.purchaseDate ?? null,
          purchaseToken: payload.purchaseToken ?? null,

          // snake_case (Laravel-style)
          user_id: payload.userId,
          plan_id: payload.planId,
          transaction_id: toStringOrEmptySafe(payload.transactionId),
          product_id: toStringOrEmpty(payload.productId),
          base_plan_id: payload.base_plan_id ?? null,
          purchase_date: payload.purchaseDate ?? null,
          purchase_token: payload.purchaseToken ?? null,
        }
      : {
          user_id: payload.userId,
          plan_id: payload.planId,
          transaction_id: toStringOrEmptySafe(payload.transactionId),
          product_id: toStringOrEmpty(payload.productId),
          base_plan_id: payload.base_plan_id ?? null,
          purchase_date: payload.purchaseDate ?? null,
          purchase_token: payload.purchaseToken ?? null,
          order_id: toStringOrEmpty(payload.orderId),
          package_name: payload.packageName ?? null,
          auto_renewing: payload.autoRenewing ?? null,
          transaction_receipt: toStringOrEmptySafe(payload.transactionReceipt),
          original_transaction_id: toStringOrEmptySafe(payload.originalTransactionId),
        };

  // Only include action/scheduling when explicitly provided (downgrade case).
  const payloadForApi: any = { ...basePayloadForApi };
  if (payload.action) payloadForApi.action = payload.action;
  if (payload.scheduledPlanId != null) payloadForApi.scheduled_plan_id = payload.scheduledPlanId;
  if (payload.scheduledStartDate != null)
    payloadForApi.scheduled_start_date = payload.scheduledStartDate;

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[verifyPurchase] Attempt ${attempt}/${maxRetries}`, {
        url: `${BASE_URL}/api/subscriptions/verify-purchase`,
        hasToken: !!token,
        payloadKeys: Object.keys(payloadForApi),
        payload: sanitizePayloadForLog(payloadForApi),
      });

      const res = await axios.post<VerifyPurchaseResponse>(
        `${BASE_URL}/api/subscriptions/verify-purchase`,
        payloadForApi,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        }
      );

      // Check if response is successful
      if (res.status >= 200 && res.status < 300) {
        console.log('[verifyPurchase] Success:', {
          status: res.status,
          responseStatus: res.data?.status,
        });
        return res.data;
      }

      // Handle 4xx errors (client errors - don't retry)
      if (res.status >= 400 && res.status < 500) {
        const errorMessage = parseApiError({ response: { data: res.data } });
        const e: any = new Error(errorMessage);
        e.noRetry = true;
        e.status = res.status;
        throw e;
      }

      // For 5xx errors, throw to trigger retry
      throw new Error(`Server error: ${res.status}`);
    } catch (err: any) {
      lastError = err;

      // Validation / client errors we intentionally surfaced should not be retried and should not be treated as network.
      if (err?.noRetry) {
        throw err;
      }

      // Log detailed error information
      console.error(`[verifyPurchase] Attempt ${attempt} failed:`, {
        message: err?.message,
        code: err?.code,
        responseStatus: err?.response?.status,
        responseData: err?.response?.data,
        isNetworkError:
          err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK' || !err?.response,
        baseUrl: BASE_URL,
      });

      // Don't retry on client errors (4xx)
      if (err?.response?.status >= 400 && err?.response?.status < 500) {
        throw new Error(parseApiError(err));
      }

      // Don't retry on authentication errors
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        throw new Error(parseApiError(err));
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        // Provide more helpful error message for network errors
        if (err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK' || !err?.response) {
          throw new Error(
            `Network error: Unable to reach the server. Please check your internet connection and try again. (${BASE_URL})`
          );
        }
        throw new Error(parseApiError(err));
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s max
      console.log(`[verifyPurchase] Retrying in ${delay}ms...`);
      await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error(parseApiError(lastError));
};
