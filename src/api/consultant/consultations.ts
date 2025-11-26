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

export interface ConsultantProfile {
  id: number;
  name: string;
  email?: string;
  profile_picture_url?: string | null;
  consultant_details?: Record<string, unknown> | null;
}

export interface ConsultantConsultation {
  id: number;
  user_id: number;
  consultant_id?: number | null;
  problem_description: string;
  image_path?: string | null;
  status: string;
  requested_at: string;
  assigned_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
  chat_window_is_open?: boolean;
  chat_window_expires_at?: string | null;
  chat_window_days?: number;
  last_message?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
  unread_count_consultant?: number;
  unread_count_user?: number;
  rating?: number;
  rating_comment?: string | null;
  consultant?: ConsultantProfile | null;
  user?: ConsultantProfile | null;
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

  list: async (): Promise<ConsultantConsultation[]> => {
    const headers = await withAuthHeaders();
    const response = await axios.get(`${BASE_URL}/api/consultant/consultations`, {
      headers,
    });
    return response.data?.data?.consultations ?? [];
  },
};
