import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import type { AppStackParamList, ConsultationStackParamList } from '@/common/types';
import SearchBar from './SearchBar';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import ActiveStylist from '@/common/components/ActiveStylists';
import { useAuth } from '@/contexts/AuthContext';
import CompleteQuestions from '@/common/components/CompleteQuestions';
import { useGetQuestionnaireStatus } from '@/api/user/questionnaire/useGetQuestionnaire';
type NavParamList = AppStackParamList & ConsultationStackParamList;

interface ChatHomeHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isRealtimeConnected: boolean;
}

const ChatHomeHeader: React.FC<ChatHomeHeaderProps> = ({
  searchQuery,
  onSearchChange,
  isRealtimeConnected,
}) => {
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NavParamList>>();
  const { horizontalPadding } = useTabletLayout();
  const { user } = useAuth();
  const { data: questionnaireStatus } = useGetQuestionnaireStatus({
    enabled: !!user,
  });
  const shouldShowCompleteQuestions =
    (questionnaireStatus?.missingRequiredQuestionIds?.length ?? 0) > 0 ||
    (questionnaireStatus?.unansweredQuestionIds?.length ?? 0) > 0 ||
    questionnaireStatus?.setupComplete === false ||
    (questionnaireStatus == null && user?.has_new_questionnaire_questions === true);
  return (
    <View className="pt-6" style={[{ paddingHorizontal: horizontalPadding }]}>
      {shouldShowCompleteQuestions && <CompleteQuestions />}
      <View className="flex-row justify-between items-center">
        <Text
          className={`${isDark ? 'text-white' : 'text-textDark'} text-2xl font-urbanist font-bold`}
        >
          Consultations
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('NewConsultant')}
          className="bg-yellow-300 px-4 py-2  rounded-full"
        >
          <Text className="font-semibold text-green-700">+ New</Text>
        </TouchableOpacity>
      </View>
      <View className="mt-1 mb-1">
        <ActiveStylist />
      </View>

      <SearchBar searchQuery={searchQuery} onSearchChange={onSearchChange} />

      <Text className={`mt-2 text-[11px] ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}>
        {isRealtimeConnected ? 'Connected to live updates' : 'Showing last synced conversations'}
      </Text>
    </View>
  );
};

export default ChatHomeHeader;
