import axios from 'axios';

import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import type { ChatMessage } from '@/types/chat';

const withAuthHeaders = async () => {
  const token = await storage.getToken();
  if (!token) {
    throw new Error('Authentication token missing');
  }

  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
};

interface ListOptions {
  limit?: number;
  before?: string;
}

interface ListResponse {
  messages: ChatMessage[];
  has_more: boolean;
  next_cursor?: string | null;
}

export const consultationMessagesApi = {
  list: async (consultationId: number, options?: ListOptions) => {
    const headers = await withAuthHeaders();
    const params = new URLSearchParams();
    if (options?.limit) {
      params.append('limit', String(options.limit));
    }
    if (options?.before) {
      params.append('before', options.before);
    }

    const queryString = params.toString();
    const url =
      `${BASE_URL}/api/consultations/${consultationId}/messages` +
      (queryString ? `?${queryString}` : '');

    const response = await axios.get<{ data?: ListResponse }>(url, { headers });

    return response.data?.data;
  },

  markChatRead: async (consultationId: number) => {
    const headers = await withAuthHeaders();
    await axios.post(
      `${BASE_URL}/api/consultations/${consultationId}/messages/read-status`,
      {},
      { headers }
    );
  },

  generatePreview: async (consultationId: number, messageId: string, url: string) => {
    const headers = await withAuthHeaders();
    await axios.post(
      `${BASE_URL}/api/consultations/${consultationId}/messages/${messageId}/preview`,
      { url },
      { headers }
    );
  },
};
