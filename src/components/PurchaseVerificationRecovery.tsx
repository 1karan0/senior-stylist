import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchaseVerificationRecovery } from '@/hooks/usePurchaseVerificationRecovery';

/**
 * Mounted near the root so we can recover/verify pending IAP purchases after:
 * - app crash / restart
 * - app resume
 * - network reconnect
 */
export default function PurchaseVerificationRecovery() {
  const { user } = useAuth();
  usePurchaseVerificationRecovery(!!user);
  return null;
}
