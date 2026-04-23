import { BASE_URL } from '@/config';
import { storage } from '@/services/storage';
import { parseApiError } from '@/utils/parseApiError';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import axios from 'axios';

export interface QuestionnaireOption {
  id: number;
  label: string;
}

export interface QuestionnaireQuestion {
  id: number;
  question: string;
  options: QuestionnaireOption[];
}

type UseGetQuestionnaireOptions = Omit<
  UseQueryOptions<QuestionnaireQuestion[]>,
  'queryKey' | 'queryFn'
>;

const mapQuestions = (payload: any): QuestionnaireQuestion[] => {
  const rawQuestions =
    payload?.data?.questions ?? payload?.data ?? payload?.questions ?? payload?.questionnaire ?? [];

  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions
    .map((q: any) => {
      const rawOptions = q?.options ?? q?.answers ?? q?.choices ?? [];
      const options = Array.isArray(rawOptions)
        ? rawOptions
            .map((opt: any) => ({
              id: Number(opt?.id ?? opt?.option_id),
              label: String(opt?.label ?? opt?.title ?? opt?.name ?? opt?.text ?? ''),
            }))
            .filter((opt: QuestionnaireOption) => Number.isFinite(opt.id) && !!opt.label)
        : [];

      return {
        id: Number(q?.id ?? q?.question_id),
        question: String(q?.question ?? q?.title ?? q?.text ?? ''),
        options,
      };
    })
    .filter(
      (q: QuestionnaireQuestion) =>
        Number.isFinite(q.id) && !!q.question && Array.isArray(q.options)
    );
};

export const useGetQuestionnaire = (options?: UseGetQuestionnaireOptions) => {
  return useQuery<QuestionnaireQuestion[]>({
    queryKey: ['questionnaire-questions'],
    queryFn: async () => {
      const token = await storage.getToken();
      if (!token) throw new Error('Auth token missing');

      try {
        const res = await axios.get(`${BASE_URL}/api/customer/questionnaire/questions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return mapQuestions(res.data);
      } catch (err) {
        throw new Error(parseApiError(err));
      }
    },
    ...options,
  });
};
