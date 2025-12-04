import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  ONBORDING_COMPLETED: 'onbording_completed',

  // new consultation draft key
  NEW_CONSULTATION_DRAFT: 'new_consultation_draft',
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

  // clear all auth data (logout)
  clearAuthData: async (): Promise<void> => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER_TOKEN, STORAGE_KEYS.USER_DATA]);
  },
};
