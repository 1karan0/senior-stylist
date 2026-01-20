import axios from 'axios';

import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';

export async function fetchFirebaseCustomToken(): Promise<string | null> {
  const token = await storage.getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/firebase/token`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    return response.data?.data?.firebase_custom_token ?? null;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to fetch Firebase custom token:', error);
    }
    return null;
  }
}
