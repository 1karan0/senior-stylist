import { BASE_URL } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { type AxiosError } from 'axios';

export interface SubmitQuestionnaireAnswer {
  question_id: number;
  option_ids: number[];
}

export interface SubmitQuestionnairePayload {
  answers: SubmitQuestionnaireAnswer[];
}

export const useSubmitQuestionnaire = () => {
  const queryClient = useQueryClient();
  const { refreshAuthUser } = useAuth();

  return useMutation({
    mutationFn: async (payload: SubmitQuestionnairePayload) => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');

      try {
        const res = await axios.post(`${BASE_URL}/api/customer/answers`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Debug: inspect raw API response (status + payload) during development.
        if (__DEV__) {
          console.log('[questionnaire][submit] response:', {
            status: res.status,
            data: res.data,
          });
        }

        return res.data;
      } catch (err) {
        const axiosErr = err as AxiosError;
        if (__DEV__) {
          console.log('[questionnaire][submit] error response:', {
            status: axiosErr.response?.status,
            data: axiosErr.response?.data,
            message: axiosErr.message,
          });
        }
        throw new Error(parseApiError(err));
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profileData'] }),
        queryClient.invalidateQueries({ queryKey: ['questionnaire-questions'] }),
        refreshAuthUser(),
      ]);
    },
  });
};
