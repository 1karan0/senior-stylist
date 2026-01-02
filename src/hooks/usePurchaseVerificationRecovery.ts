import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as RNIap from 'react-native-iap';
import { useQueryClient } from '@tanstack/react-query';
import { verifyPurchase } from '@/api/subscription/verifyPurchase';
import { storage, type PendingPurchaseVerification } from '@/services/storage';

const PROFILE_QUERY_KEY = ['profileData'];

const isProbablyNetworkError = (message: string) => {
  const m = (message || '').toLowerCase();
  return (
    m.includes('network error') ||
    m.includes('unable to reach the server') ||
    m.includes('timeout') ||
    m.includes('ecconnaborted')
  );
};

/**
 * Crash/offline recovery for IAP:
 * - Reads pending purchase verifications from AsyncStorage
 * - If online + authed, retries backend verification
 * - On success: acknowledges Android purchase (best-effort) and clears the pending item
 */
export const usePurchaseVerificationRecovery = (enabled: boolean) => {
  const queryClient = useQueryClient();
  const isRunningRef = useRef(false);
  const lastRunAtRef = useRef(0);

  const runOnce = useCallback(
    async (reason: string) => {
      if (!enabled) return;
      if (isRunningRef.current) return;

      const now = Date.now();
      // simple debounce to avoid rapid NetInfo/AppState spam
      if (now - lastRunAtRef.current < 4000) return;
      lastRunAtRef.current = now;

      isRunningRef.current = true;
      try {
        const token = await storage.getToken();
        if (!token) return;

        const pending = await storage.getPendingPurchaseVerifications();
        if (!pending.length) return;

        // Process oldest first
        const ordered = [...pending].sort((a, b) => a.createdAt - b.createdAt);

        for (const item of ordered) {
          // cap attempts to avoid infinite loops in pathological cases
          if ((item.attempts ?? 0) >= 12) continue;

          try {
            // Ensure critical fields exist even if older app versions stored partial payloads.
            const payloadToVerify: any = {
              ...(item.payload || {}),
              planId: item.payload?.planId ?? item.planId,
              purchaseDate: item.payload?.purchaseDate ?? item.purchaseDate ?? null,
            };

            const res = await verifyPurchase(payloadToVerify);
            const ok = (res as any)?.status === 'success';
            if (!ok) {
              throw new Error((res as any)?.message || 'Verification failed');
            }

            // Best-effort Android acknowledgment if we have the purchase token
            if (item.platform === 'android') {
              const tokenAndroid = item?.payload?.purchaseToken;
              if (typeof tokenAndroid === 'string' && tokenAndroid.trim()) {
                try {
                  if (typeof (RNIap as any).acknowledgePurchaseAndroid === 'function') {
                    await (RNIap as any).acknowledgePurchaseAndroid(tokenAndroid);
                  }
                } catch {
                  // ignore ack errors; backend verification is the priority
                }
              }
            }

            await storage.removePendingPurchaseVerification(item.id);
            await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
          } catch (err: any) {
            const message = String(err?.message || 'Unknown error');
            const next: PendingPurchaseVerification = {
              ...item,
              attempts: (item.attempts ?? 0) + 1,
              updatedAt: Date.now(),
              lastError: message,
            };
            await storage.upsertPendingPurchaseVerification(next);

            // If offline / transient network issue, stop processing more to avoid hammering
            if (isProbablyNetworkError(message)) {
              break;
            }
          }
        }
      } finally {
        isRunningRef.current = false;
      }
    },
    [enabled, queryClient]
  );

  useEffect(() => {
    if (!enabled) return;
    runOnce('mount');
  }, [enabled, runOnce]);

  useEffect(() => {
    if (!enabled) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runOnce('app_active');
    });
    return () => sub.remove();
  }, [enabled, runOnce]);

  useEffect(() => {
    if (!enabled) return;

    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        runOnce('net_reconnect');
      }
    });
    return () => unsub();
  }, [enabled, runOnce]);

  return { runNow: () => runOnce('manual') };
};
