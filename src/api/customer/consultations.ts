import axios from 'axios';

import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import type { ConsultantConsultation } from '@/api/consultant/consultations';

interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export const customerConsultationsApi = {
  get: async (id: number): Promise<ApiResponse<{ consultation: ConsultantConsultation }>> => {
    const token = await storage.getToken();
    if (!token) {
      throw new Error('Auth token missing');
    }

    const response = await axios.get<ApiResponse<{ consultation: ConsultantConsultation }>>(
      `${BASE_URL}/api/customer/consultations/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },
};
