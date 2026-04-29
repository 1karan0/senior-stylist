import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import axios, { type AxiosError } from 'axios';

export interface QuestionnaireOption {
  id: number;
  label: string;
}

export interface QuestionnaireQuestion {
  id: number;
  question: string;
  options: QuestionnaireOption[];
}

interface BackendQuestionOption {
  id: number;
  label: string;
  value: string;
  normalized_key: string;
  sort_order: number;
}

interface BackendQuestion {
  id: number;
  question: string;
  input_kind: string;
  section: string;
  is_required: boolean;
  is_matching_field: boolean;
  max_select: number | null;
  sort_order: number;
  options: BackendQuestionOption[];
}

interface GetQuestionnaireResponse {
  status: string;
  code: number;
  message: string;
  data: {
    questions: BackendQuestion[];
    answers: unknown[];
    setup_complete: boolean;
    missing_required_question_ids: number[];
    customer_questionnaire_completed_at: string | null;
  };
}

type UseGetConsultantQuestionnaireOptions = Omit<
  UseQueryOptions<QuestionnaireQuestion[]>,
  'queryKey' | 'queryFn'
>;

const mapQuestions = (payload: GetQuestionnaireResponse): QuestionnaireQuestion[] => {
  const rawQuestions = payload?.data?.questions ?? [];
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions.map((question) => ({
    id: question.id,
    question: question.question,
    options: (question.options ?? []).map((option) => ({
      id: option.id,
      label: option.label,
    })),
  }));
};

export const useGetConsultantQuestionnaire = (options?: UseGetConsultantQuestionnaireOptions) => {
  return useQuery<QuestionnaireQuestion[]>({
    queryKey: ['consultant-questionnaire-questions'],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');

      try {
        const res = await axios.get<GetQuestionnaireResponse>(
          `${BASE_URL}/api/consultant/questions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Debug: inspect raw API response (status + payload) during development.
        if (__DEV__) {
          // Avoid logging auth token; Axios will strip headers anyway.
          console.log('[consultant-questionnaire][get] response:', {
            status: res.status,
            data: res.data,
          });
        }

        return mapQuestions(res.data);
      } catch (err) {
        const axiosErr = err as AxiosError;
        if (__DEV__) {
          console.log('[questionnaire][get] error response:', {
            status: axiosErr.response?.status,
            data: axiosErr.response?.data,
            message: axiosErr.message,
          });
        }
        throw new Error(parseApiError(err));
      }
    },
    ...options,
  });
};
