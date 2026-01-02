import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  ONBORDING_COMPLETED: 'onbording_completed',

  // new consultation draft key
  NEW_CONSULTATION_DRAFT: 'new_consultation_draft',

  // new signup flag (to show Pricing screen only for new registrations)
  IS_NEW_SIGNUP: 'is_new_signup',
  // dismissed review modals tracking
  DISMISSED_REVIEW_MODALS: 'dismissed_review_modals',

  // pending IAP purchase verifications (for crash/offline recovery)
  PENDING_PURCHASE_VERIFICATIONS: 'pending_purchase_verifications',
};

export interface PendingPurchaseVerification {
  id: string; // stable dedupe key (purchaseToken / transactionId / orderId)
  platform: 'android' | 'ios';
  // Needed to re-run verify after crash/offline (without relying on UI state)
  planId: number;
  purchaseDate: string | number | null;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  lastError?: string | null;
  payload: any; // VerifyPurchasePayload (kept as any to avoid circular deps)
}

export const storage = {
  // token management
  setToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
  },

  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  },

  removeToken: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
  },

  // user data management
  setUserData: async (userData: any): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  },

  getUserData: async (): Promise<any> => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  removeUserData: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  // onboarding status
  setOnbordingCompleted: async (): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBORDING_COMPLETED, 'true');
  },

  getOnbordingCompleted: async (): Promise<boolean> => {
    const status = await AsyncStorage.getItem(STORAGE_KEYS.ONBORDING_COMPLETED);
    return status === 'true';
  },

  // new consultation draft
  setConsultationDraft: async (draft: any): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.NEW_CONSULTATION_DRAFT, JSON.stringify(draft));
  },

  getConsultationDraft: async (): Promise<any | null> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NEW_CONSULTATION_DRAFT);
    return raw ? JSON.parse(raw) : null;
  },

  removeConsultationDraft: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.NEW_CONSULTATION_DRAFT);
  },

  // new signup flag management (to show Pricing screen only for new registrations)
  setIsNewSignup: async (isNew: boolean): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.IS_NEW_SIGNUP, isNew ? 'true' : 'false');
  },

  getIsNewSignup: async (): Promise<boolean> => {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.IS_NEW_SIGNUP);
    return value === 'true';
  },

  removeIsNewSignup: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.IS_NEW_SIGNUP);
  },

  // dismissed review modals tracking (to reopen after app restart)
  getDismissedReviewModals: async (): Promise<string[]> => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DISMISSED_REVIEW_MODALS);
    return data ? JSON.parse(data) : [];
  },

  setDismissedReviewModals: async (consultationIds: string[]): Promise<void> => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.DISMISSED_REVIEW_MODALS,
      JSON.stringify(consultationIds)
    );
  },

  addDismissedReviewModal: async (consultationId: string): Promise<void> => {
    const dismissed = await storage.getDismissedReviewModals();
    if (!dismissed.includes(consultationId)) {
      dismissed.push(consultationId);
      await storage.setDismissedReviewModals(dismissed);
    }
  },

  removeDismissedReviewModal: async (consultationId: string): Promise<void> => {
    const dismissed = await storage.getDismissedReviewModals();
    const filtered = dismissed.filter((id) => id !== consultationId);
    await storage.setDismissedReviewModals(filtered);
  },

  clearDismissedReviewModals: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.DISMISSED_REVIEW_MODALS);
  },

  // pending purchase verifications (crash/offline recovery)
  getPendingPurchaseVerifications: async (): Promise<PendingPurchaseVerification[]> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_PURCHASE_VERIFICATIONS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  upsertPendingPurchaseVerification: async (item: PendingPurchaseVerification): Promise<void> => {
    const existing = await storage.getPendingPurchaseVerifications();
    const idx = existing.findIndex((p) => p.id === item.id);
    const next = [...existing];
    if (idx >= 0) next[idx] = item;
    else next.push(item);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_PURCHASE_VERIFICATIONS, JSON.stringify(next));
  },

  removePendingPurchaseVerification: async (id: string): Promise<void> => {
    const existing = await storage.getPendingPurchaseVerifications();
    const next = existing.filter((p) => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_PURCHASE_VERIFICATIONS, JSON.stringify(next));
  },

  clearPendingPurchaseVerifications: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_PURCHASE_VERIFICATIONS);
  },

  // clear all auth data (logout)
  clearAuthData: async (): Promise<void> => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.IS_NEW_SIGNUP,
      STORAGE_KEYS.PENDING_PURCHASE_VERIFICATIONS,
    ]);
  },
};
