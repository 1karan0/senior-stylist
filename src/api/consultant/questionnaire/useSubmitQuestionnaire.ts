import { BASE_URL } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface SubmitQuestionnaireAnswer {
  question_id: number;
  option_ids: number[];
}

export interface SubmitQuestionnairePayload {
  answers: SubmitQuestionnaireAnswer[];
}

export const useSubmitConsultantQuestionnaire = () => {
  const queryClient = useQueryClient();
  const { refreshAuthUser } = useAuth();

  return useMutation({
    mutationFn: async (payload: SubmitQuestionnairePayload) => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');

      try {
        const res = await axios.post(`${BASE_URL}/api/consultant/answers`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        return res.data;
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profileData'] }),
        queryClient.invalidateQueries({ queryKey: ['consultant-questionnaire-questions'] }),
        refreshAuthUser(),
      ]);
    },
  });
};
