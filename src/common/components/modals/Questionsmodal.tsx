import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import {
  useGetQuestionnaire,
  type QuestionnaireQuestion,
} from '@/api/user/questionnaire/useGetQuestionnaire';
import { useSubmitQuestionnaire } from '@/api/user/questionnaire/useSubmitQuestionnaire';

import CheckboxField from '@/common/components/CheckboxField';
import { useTheme } from '@/contexts/ThemeContext';
import { ModalWrapper } from '../ModalWrapper';

interface QuestionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const QuestionsModal = ({ visible, onClose }: QuestionsModalProps) => {
  const { isDark } = useTheme();
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<number, number>>({});
  const {
    data: questions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetQuestionnaire({
    enabled: visible,
  });
  const submitQuestionnaire = useSubmitQuestionnaire();

  useEffect(() => {
    if (!visible) return;
    setSelectedByQuestion({});
  }, [visible]);

  const selectOneOption = (questionId: number, optionId: number) => {
    setSelectedByQuestion((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const canContinue = useMemo(
    () => questions.length > 0 && questions.every((question) => !!selectedByQuestion[question.id]),
    [questions, selectedByQuestion]
  );

  const handleSubmit = async () => {
    if (!canContinue || submitQuestionnaire.isPending) return;

    const answers = questions.map((question) => ({
      question_id: question.id,
      option_id: selectedByQuestion[question.id],
    }));

    await submitQuestionnaire.mutateAsync({ answers });
    onClose();
  };

  const renderQuestion = (question: QuestionnaireQuestion, index: number) => (
    <View className="mb-4" key={question.id}>
      <Text
        className={`text-sm font-urbanist-bold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
      >
        {index + 1}) {question.question}
      </Text>
      <View className="gap-2">
        {question.options.map((option) => (
          <CheckboxField
            key={option.id}
            label={option.label}
            checked={selectedByQuestion[question.id] === option.id}
            onPress={() => selectOneOption(question.id, option.id)}
            disabled={submitQuestionnaire.isPending}
            className="w-full"
          />
        ))}
      </View>
    </View>
  );

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      containerClassName={`border rounded-2xl ${
        isDark ? 'bg-[#0D1A16] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
      } px-5 py-6`}
    >
      <TouchableOpacity onPress={onClose} className="absolute top-3 right-3 z-10">
        <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
      </TouchableOpacity>

      <Text
        className={`text-2xl font-urbanist-bold pr-8 ${isDark ? 'text-white' : 'text-textDark'}`}
      >
        Help us find better results for you
      </Text>
      <Text
        className={`mt-1 text-sm font-poppins ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
      >
        Complete this quick questionnaire for better stylist matching.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-4 max-h-[430px]">
        {isLoading ? (
          <Text
            className={`text-sm font-poppins ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
          >
            Loading questions...
          </Text>
        ) : null}

        {isError ? (
          <View
            className={`rounded-xl border px-3 py-3 ${
              isDark ? 'border-[#273F36] bg-[#132520]' : 'border-[#DAE7E0] bg-[#F7FAF8]'
            }`}
          >
            <Text
              className={`text-sm font-poppins ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              {error instanceof Error ? error.message : 'Failed to load questions'}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-2 self-start rounded-lg bg-textPrimary px-3 py-1.5"
            >
              <Text className="text-white font-urbanist-semibold text-sm">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isLoading && !isError && questions.length === 0 ? (
          <Text
            className={`text-sm font-poppins ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
          >
            No questionnaire available right now.
          </Text>
        ) : null}

        {!isLoading && !isError
          ? questions.map((question, index) => renderQuestion(question, index))
          : null}
      </ScrollView>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!canContinue || submitQuestionnaire.isPending}
        activeOpacity={0.85}
        className={`mt-4 rounded-xl py-3 ${
          canContinue && !submitQuestionnaire.isPending ? 'bg-textPrimary' : 'bg-[#8AA897]'
        }`}
      >
        <Text className="text-center text-white font-urbanist-bold text-base">
          {submitQuestionnaire.isPending ? 'Saving...' : 'Save & Continue'}
        </Text>
      </TouchableOpacity>
    </ModalWrapper>
  );
};

export default QuestionsModal;
