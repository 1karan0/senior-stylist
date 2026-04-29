import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import {
  useGetQuestionnaire,
  type QuestionnaireQuestion as CustomerQuestionnaireQuestion,
} from '@/api/user/questionnaire/useGetQuestionnaire';
import { useSubmitQuestionnaire } from '@/api/user/questionnaire/useSubmitQuestionnaire';
import {
  useGetConsultantQuestionnaire,
  type QuestionnaireQuestion as ConsultantQuestionnaireQuestion,
} from '@/api/consultant/questionnaire/useGetQuestionnaire';
import { useSubmitConsultantQuestionnaire } from '@/api/consultant/questionnaire/useSubmitQuestionnaire';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface QuestionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const QuestionsModal = ({ visible, onClose }: QuestionsModalProps) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isConsultant = user?.role === 'consultant';
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<number, number[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const questionOpacity = useRef(new Animated.Value(1)).current;
  const questionTranslateX = useRef(new Animated.Value(0)).current;
  const customerQuestionnaire = useGetQuestionnaire({
    enabled: visible && !isConsultant,
  });
  const consultantQuestionnaire = useGetConsultantQuestionnaire({
    enabled: visible && isConsultant,
  });
  const submitCustomerQuestionnaire = useSubmitQuestionnaire();
  const submitConsultantQuestionnaire = useSubmitConsultantQuestionnaire();

  const activeQuestionnaire = isConsultant ? consultantQuestionnaire : customerQuestionnaire;
  const submitQuestionnaire = isConsultant
    ? submitConsultantQuestionnaire
    : submitCustomerQuestionnaire;

  const { data: questions = [], isLoading, isError, error, refetch } = activeQuestionnaire;

  useEffect(() => {
    if (!visible) return;
    setSelectedByQuestion({});
    setCurrentQuestionIndex(0);
    setIsTransitioning(false);
    setShowSuccessModal(false);
    questionOpacity.setValue(1);
    questionTranslateX.setValue(0);
  }, [visible]);

  const hasSelection = (questionId: number) => (selectedByQuestion[questionId]?.length ?? 0) > 0;

  const toggleQuestionOption = (
    questionId: number,
    optionId: number,
    inputKind: string,
    maxSelect?: number | null
  ) => {
    setSelectedByQuestion((prev) => {
      const current = prev[questionId] ?? [];

      if (inputKind === 'multi_select') {
        const isSelected = current.includes(optionId);
        if (isSelected) {
          return { ...prev, [questionId]: current.filter((id) => id !== optionId) };
        }

        const next = [...current, optionId];
        if (maxSelect && next.length > maxSelect) {
          return { ...prev, [questionId]: next.slice(next.length - maxSelect) };
        }
        return { ...prev, [questionId]: next };
      }

      return { ...prev, [questionId]: [optionId] };
    });
  };

  useEffect(() => {
    if (questions.length === 0) {
      setCurrentQuestionIndex(0);
      return;
    }

    setCurrentQuestionIndex((prev) => Math.min(prev, questions.length - 1));
  }, [questions.length]);

  const canContinue = useMemo(
    () => questions.length > 0 && questions.every((question) => hasSelection(question.id)),
    [questions, selectedByQuestion]
  );

  const handleSubmit = async () => {
    if (!canContinue || submitQuestionnaire.isPending) return;

    const answers = questions.map((question) => ({
      question_id: question.id,
      option_ids: selectedByQuestion[question.id] ?? [],
    }));

    await submitQuestionnaire.mutateAsync({ answers });
    setShowSuccessModal(true);
  };

  const activeQuestion = questions[currentQuestionIndex] as
    | CustomerQuestionnaireQuestion
    | ConsultantQuestionnaireQuestion
    | undefined;
  const totalQuestions = questions.length;
  const isLastQuestion = totalQuestions > 0 && currentQuestionIndex === totalQuestions - 1;
  const hasSelectedCurrent = activeQuestion ? hasSelection(activeQuestion.id) : false;
  const progressPercent =
    totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const animateToQuestion = (targetIndex: number, direction: 1 | -1) => {
    if (isTransitioning || targetIndex === currentQuestionIndex) return;
    if (targetIndex < 0 || targetIndex > totalQuestions - 1) return;

    setIsTransitioning(true);

    Animated.parallel([
      Animated.timing(questionOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(questionTranslateX, {
        toValue: direction === 1 ? -22 : 22,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentQuestionIndex(targetIndex);
      questionTranslateX.setValue(direction === 1 ? 22 : -22);

      Animated.parallel([
        Animated.timing(questionOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(questionTranslateX, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  const handleOptionSelect = (
    question: CustomerQuestionnaireQuestion | ConsultantQuestionnaireQuestion,
    optionId: number
  ) => {
    const inputKind = 'input_kind' in question ? question.input_kind : 'single_select';
    const maxSelect = 'max_select' in question ? question.max_select : null;
    toggleQuestionOption(question.id, optionId, inputKind, maxSelect);

    if (inputKind === 'multi_select' || isLastQuestion) return;

    animateToQuestion(Math.min(currentQuestionIndex + 1, totalQuestions - 1), 1);
  };

  const handleNext = async () => {
    if (!activeQuestion || !hasSelectedCurrent || submitQuestionnaire.isPending || isTransitioning)
      return;

    if (isLastQuestion) {
      await handleSubmit();
      return;
    }

    animateToQuestion(Math.min(currentQuestionIndex + 1, totalQuestions - 1), 1);
  };

  const handlePrevious = () => {
    if (submitQuestionnaire.isPending || isTransitioning) return;
    animateToQuestion(Math.max(currentQuestionIndex - 1, 0), -1);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-[#0D1A16]' : 'bg-white'}`}>
        <View className="flex-1 px-5 py-4">
          <TouchableOpacity onPress={onClose} className="self-end mb-2">
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

          <View className="mt-4 flex-1">
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

            {!isLoading && !isError && activeQuestion ? (
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    className={`text-xs font-poppins ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                  >
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </Text>
                  <Text
                    className={`text-xs font-poppins ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                  >
                    {Math.round(progressPercent)}%
                  </Text>
                </View>

                <View
                  className={`h-2 w-full rounded-full overflow-hidden ${
                    isDark ? 'bg-[#1A2D27]' : 'bg-[#EAF1ED]'
                  }`}
                >
                  <View
                    className="h-2 rounded-full bg-textPrimary"
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>

                <Animated.View
                  className="flex-1"
                  style={{
                    opacity: questionOpacity,
                    transform: [{ translateX: questionTranslateX }],
                  }}
                >
                  <ScrollView className="mt-5 mb-4 flex-1" showsVerticalScrollIndicator={false}>
                    <Text
                      className={`text-lg font-urbanist-bold mb-4 ${isDark ? 'text-white' : 'text-textDark'}`}
                    >
                      {activeQuestion.question}
                    </Text>
                    <View className="gap-2">
                      {activeQuestion.options.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          onPress={() => handleOptionSelect(activeQuestion, option.id)}
                          disabled={submitQuestionnaire.isPending || isTransitioning}
                          activeOpacity={0.85}
                          className={`w-full rounded-xl border px-4 py-6 ${
                            (selectedByQuestion[activeQuestion.id] ?? []).includes(option.id)
                              ? isDark
                                ? 'border-[#2CCB91] bg-[#15362D]'
                                : 'border-[#2CCB91] bg-[#EAF9F2]'
                              : isDark
                                ? 'border-[#2F433B] bg-[#132520]'
                                : 'border-[#DAE7E0] bg-white'
                          }`}
                        >
                          <Text
                            className={`font-poppins ${isDark ? 'text-white' : 'text-textDark'}`}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </Animated.View>

                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={handlePrevious}
                    disabled={
                      currentQuestionIndex === 0 || submitQuestionnaire.isPending || isTransitioning
                    }
                    activeOpacity={0.85}
                    className={`flex-1 rounded-xl py-3 border ${
                      currentQuestionIndex === 0 || submitQuestionnaire.isPending
                        ? isDark
                          ? 'border-[#3A5048] bg-[#1A2D27]'
                          : 'border-[#D4E1DA] bg-[#F2F6F4]'
                        : isDark
                          ? 'border-[#3A5048] bg-[#132520]'
                          : 'border-[#DAE7E0] bg-white'
                    }`}
                  >
                    <Text
                      className={`text-center font-urbanist-bold text-base ${
                        isDark ? 'text-white' : 'text-textDark'
                      }`}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleNext}
                    disabled={
                      !hasSelectedCurrent || submitQuestionnaire.isPending || isTransitioning
                    }
                    activeOpacity={0.85}
                    className={`flex-1 rounded-xl py-3 ${
                      hasSelectedCurrent && !submitQuestionnaire.isPending
                        ? 'bg-textPrimary'
                        : 'bg-[#8AA897]'
                    }`}
                  >
                    <Text className="text-center text-white font-urbanist-bold text-base">
                      {submitQuestionnaire.isPending
                        ? 'Saving...'
                        : isLastQuestion
                          ? 'Finish'
                          : 'Next'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
      {showSuccessModal ? (
        <View className="absolute inset-0 bg-black/70 items-center justify-center px-5">
          <View
            className={`w-full rounded-2xl border px-5 py-6 ${
              isDark ? 'bg-[#0D1A16] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
            }`}
          >
            <View className="items-center">
              <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
              <Text
                className={`mt-3 text-xl font-urbanist-bold text-center ${
                  isDark ? 'text-white' : 'text-textDark'
                }`}
              >
                Thank you!
              </Text>
              <Text
                className={`mt-2 text-sm font-poppins text-center ${
                  isDark ? 'text-textSecondary' : 'text-textMuted'
                }`}
              >
                You have completed your questions successfully.
              </Text>
            </View>

            <TouchableOpacity
              className="mt-6 rounded-xl py-3 bg-textPrimary"
              activeOpacity={0.85}
              onPress={() => {
                setShowSuccessModal(false);
                onClose();
              }}
            >
              <Text className="text-center text-white font-urbanist-bold text-base">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </Modal>
  );
};

export default QuestionsModal;
