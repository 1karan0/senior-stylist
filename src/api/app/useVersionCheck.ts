import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { parseApiError } from '@/utils/parseApiError';

export interface VersionCheckRequest {
  platform: 'ios' | 'android';
  current_version: string;
}

export interface VersionCheckResponse {
  status: string;
  code: number;
  message: string;
  data: {
    force_update_required: boolean;
    current_version: string;
    min_required_version: string;
    message: string;
  };
}

export const useVersionCheck = () => {
  return useMutation<VersionCheckResponse, Error, VersionCheckRequest>({
    mutationFn: async (payload: VersionCheckRequest) => {
      try {
        const res = await axios.post<VersionCheckResponse>(
          `${BASE_URL}/api/app/version-check`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
  });
};
