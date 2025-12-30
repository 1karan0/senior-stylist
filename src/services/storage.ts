import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  ONBORDING_COMPLETED: 'onbording_completed',

  // new consultation draft key
  NEW_CONSULTATION_DRAFT: 'new_consultation_draft',

  // subscription data
  USER_SUBSCRIPTION: 'user_subscription',
  // new signup flag (to show Pricing screen only for new registrations)
  IS_NEW_SIGNUP: 'is_new_signup',
};

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

  // subscription data management
  setUserSubscription: async (subscriptionData: any): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SUBSCRIPTION, JSON.stringify(subscriptionData));
  },

  getUserSubscription: async (): Promise<any | null> => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SUBSCRIPTION);
    return data ? JSON.parse(data) : null;
  },

  removeUserSubscription: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_SUBSCRIPTION);
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

  // clear all auth data (logout)
  clearAuthData: async (): Promise<void> => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.USER_SUBSCRIPTION,
      STORAGE_KEYS.IS_NEW_SIGNUP,
    ]);
  },
};
