import axios from 'axios';

import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';

const withAuthHeaders = async () => {
  const token = await storage.getToken();
  if (!token) {
    throw new Error('Authentication token missing');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
};

export interface ConsultantUser {
  id: number;
  name: string;
  email?: string;
  profile_picture_url?: string | null;
}

export interface ConsultantConsultation {
  id: number;
  user_id: number;
  consultant_id?: number;
  problem_description: string;
  image_path?: string | null;
  status: string;
  requested_at: string;
  expires_at?: string | null;
  user?: ConsultantUser | null;
}

export const consultantConsultationsApi = {
  available: async (): Promise<ConsultantConsultation[]> => {
    const headers = await withAuthHeaders();
    const response = await axios.get(`${BASE_URL}/api/consultant/consultations/available`, {
      headers,
    });
    return response.data?.data?.consultations ?? [];
  },

  get: async (id: number): Promise<ConsultantConsultation | null> => {
    const headers = await withAuthHeaders();
    const response = await axios.get(`${BASE_URL}/api/consultant/consultations/${id}`, {
      headers,
    });
    return response.data?.data?.consultation ?? null;
  },

  accept: async (id: number): Promise<void> => {
    const headers = await withAuthHeaders();
    await axios.post(`${BASE_URL}/api/consultant/consultations/${id}/accept`, undefined, {
      headers,
    });
  },
};
