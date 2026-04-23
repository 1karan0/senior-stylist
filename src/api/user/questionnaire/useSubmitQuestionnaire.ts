import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export interface SubmitQuestionnaireAnswer {
  question_id: number;
  option_id: number;
}

export interface SubmitQuestionnairePayload {
  answers: SubmitQuestionnaireAnswer[];
}

export const useSubmitQuestionnaire = () => {
  return useMutation({
    mutationFn: async (payload: SubmitQuestionnairePayload) => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');

      try {
        const res = await axios.post(`${BASE_URL}/api/customer/questionnaire/answers`, payload, {
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
  });
};
