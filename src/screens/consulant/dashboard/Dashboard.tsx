import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import EarningsPDFModal from '../../../common/components/modals/EarningsPDFModal';
// import EarningsModal from './EarningsModal';
// import { Button } from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { useGetLeaderboard } from '@/api/consultant/useGetLeaderboard';
import Button from '@/common/components/Button';
import { BASE_URL } from '@/config';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { ModalWrapper } from '@/common/components/ModalWrapper';
import { useNavigation } from '@react-navigation/native';
import ActiveStylist from '@/common/components/ActiveStylists';
import { useAuth } from '@/contexts/AuthContext';
import CompleteQuestions from '@/common/components/CompleteQuestions';

const Dashboard: React.FC = () => {
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [showBioPrompt, setShowBioPrompt] = useState(false);
  const [hasPromptedBio, setHasPromptedBio] = useState(false);
  const { isDark } = useTheme();
  const { data: profileData } = useGetProfile();
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useGetLeaderboard();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const isQuestionnaireCompleted = user?.stylist_questionnaire_completed_at === null;
  const profileuser = profileData?.user as any;
  const totalSessions = profileuser?.consultant_details?.total_sessions ?? 0;
  const averageRating = profileuser?.consultant_details?.average_rating ?? 0;
  const activeSessions = profileuser?.consultant_details?.active_sessions ?? 0;
  const totalSessionsChange = profileuser?.consultant_details?.total_sessions_change ?? 0;
  const averageRatingChange = profileuser?.consultant_details?.average_rating_change ?? 0;

  useEffect(() => {
    if (hasPromptedBio) return;
    if (!user) return;

    const role = user?.role;
    const bioFromConsultantDetails = profileuser?.consultant_details?.bio;
    const fallbackBio = profileuser?.bio;
    const bio = (bioFromConsultantDetails ?? fallbackBio ?? '').trim();

    if (role === 'consultant' && !bio) {
      setShowBioPrompt(true);
      setHasPromptedBio(true);
    }
  }, [user, hasPromptedBio]);

  // Keep these values in sync with your tab navigator
  const { paddingBottom } = useTabBarSafePadding();
  const { horizontalPadding } = useTabletLayout();
  // PDF URL for About Earnings - Update this with your actual PDF URL
  const EARNINGS_PDF_URL = `${BASE_URL}/Stylist_Pay_Protocol_Partnership_and_Growth-v1.pdf`; // Replace with your actual PDF URL

  const handleOpenEarningsPDF = () => {
    setPdfModalVisible(true);
  };

  const handleEditBioNow = () => {
    setShowBioPrompt(false);
    navigation.navigate('ProfileTab' as never, { screen: 'EditProfile' } as never);
  };

  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
        <View className="py-6" style={{ paddingHorizontal: horizontalPadding }}>
          {isQuestionnaireCompleted && <CompleteQuestions />}
          <Text
            className={`text-2xl font-urbanist-bold  ${isDark ? 'text-white' : 'text-textDark'}`}
          >
            Dashboard
          </Text>
          <View className="mt-4">
            <ActiveStylist />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          // critical: ensure bottom content can scroll above absolute tab bar
          contentContainerStyle={{ paddingBottom }}
        >
          {/* Stats Grid */}
          <View style={{ paddingHorizontal: horizontalPadding }}>
            {/* Total Sessions and Avg Rating - Side by Side */}
            <View className="flex-row justify-between mb-4">
              {/* Total Sessions */}
              <View
                className={`rounded-xl p-4 flex-1 mr-2 shadow-sm border ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
              >
                <View className="flex-col items-center">
                  <View className="flex-row items-center justify-between w-full mb-1">
                    <View className="flex-1" /> {/* Spacer to balance the layout */}
                    <View className="w-10 h-10 flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                      <Ionicons name="chatbubble-outline" size={20} color="#27B07D" />
                    </View>
                    <Text className="text-textPrimary text-sm font-poppins-medium">
                      {totalSessionsChange}
                    </Text>
                  </View>
                  <Text
                    className={`font-urbanist-bold text-3xl  mt-2 ${isDark ? 'text-white' : 'text-textDark'}`}
                  >
                    {totalSessions}
                  </Text>
                  <Text
                    className={`font-poppins-regular  text-sm ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                  >
                    Total Sessions
                  </Text>
                </View>
              </View>

              {/* Avg Rating */}
              <View
                className={`rounded-xl p-4 flex-1 ml-2 shadow-sm border ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
              >
                <View className="flex-col items-center">
                  <View className="flex-row items-center justify-between w-full mb-1">
                    <View className="flex-1" /> {/* Spacer to balance the layout */}
                    <View className="w-10 h-10 flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                      <Ionicons name="star-outline" size={20} color="#27B07D" />
                    </View>
                    <Text className="text-textPrimary text-sm font-poppins-medium">
                      {averageRatingChange.toFixed
                        ? averageRatingChange.toFixed(1)
                        : averageRatingChange}
                    </Text>
                  </View>
                  <Text
                    className={`font-urbanist-bold text-3xl  mt-2 ${isDark ? 'text-white' : 'text-textDark'}`}
                  >
                    {averageRating.toFixed ? averageRating.toFixed(1) : averageRating}
                  </Text>
                  <Text
                    className={`font-poppins-regular  text-sm ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                  >
                    Avg Rating
                  </Text>
                </View>
              </View>
            </View>

            {/* Active Sessions - Full Width */}
            <View className="mb-5">
              <View
                className={`rounded-xl p-4 shadow-sm border ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
              >
                <View className="flex-col items-center">
                  <View className="flex-row items-center justify-center w-full mb-1">
                    <View className="w-10 h-10 flex items-center justify-center">
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#27B07D" />
                    </View>
                  </View>
                  <Text
                    className={`font-urbanist-bold text-3xl  mt-2 ${isDark ? 'text-white' : 'text-textDark'}`}
                  >
                    {activeSessions}
                  </Text>
                  <Text
                    className={`font-poppins-regular  text-sm ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                  >
                    Active Sessions
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* About Earnings Button */}
          <View className="mb-5" style={{ paddingHorizontal: horizontalPadding }}>
            <Button
              text="About Earnings"
              icon={<Text className="text-white text-xl font-bold">$</Text>}
              onPress={handleOpenEarningsPDF}
              variant="gradient"
              className="shadow-sm"
            />
          </View>

          {/* Leaderboard Section */}
          <View style={{ paddingHorizontal: horizontalPadding }}>
            <View
              className={` border py-6 px-4 mb-8 rounded-xl  ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'}`}
            >
              <Text
                className={`text-xl font-urbanist-semibold ${isDark ? 'text-white' : 'text-textDark '}`}
              >
                Leaderboard
              </Text>
              <Text
                className={`font-poppins-regular mb-4 text-sm ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
              >
                {leaderboardData
                  ? `Showing latest available leaderboard: ${leaderboardData.month_name} ${leaderboardData.year}`
                  : 'Your latest consultations'}
              </Text>

              {/* Leaderboard Items */}
              {isLoadingLeaderboard ? (
                <View className="items-center py-8">
                  <Text className={`text-sm ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}>
                    Loading leaderboard...
                  </Text>
                </View>
              ) : leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 ? (
                leaderboardData.leaderboard.map((item) => (
                  <View
                    key={item.consultant_id}
                    className={`rounded-xl p-4 mb-3 border ${isDark ? 'bg-[#233931] border-[#445E54]' : 'bg-[#F5F9F7] border-[#DAE7E0]'}`}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center flex-1">
                        {/* Rank Badge */}
                        <View
                          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                            item.rank === 1
                              ? 'bg-yellow-400'
                              : item.rank === 2
                                ? 'bg-gray-300'
                                : item.rank === 3
                                  ? 'bg-orange-300'
                                  : isDark
                                    ? 'bg-[#445E54]'
                                    : 'bg-[#DAE7E0]'
                          }`}
                        >
                          <Text
                            className={`font-urbanist-bold text-sm ${
                              item.rank <= 3
                                ? 'text-white'
                                : isDark
                                  ? 'text-white'
                                  : 'text-textDark'
                            }`}
                          >
                            {item.rank}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`font-urbanist-semibold text-base ${isDark ? 'text-white' : 'text-textDark'}`}
                          >
                            {item.name}
                          </Text>
                          <Text
                            className={`font-poppins-regular text-sm ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                          >
                            {item.consultations_count} consultations
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center py-8">
                  <Text className={`text-sm ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}>
                    No leaderboard data available
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* PDF Modal */}
        <EarningsPDFModal
          visible={pdfModalVisible}
          pdfUrl={EARNINGS_PDF_URL}
          onClose={() => setPdfModalVisible(false)}
        />
        {/* Prompt stylist to add bio if missing */}
        <ModalWrapper
          visible={showBioPrompt}
          onClose={() => setShowBioPrompt(false)}
          containerClassName={`border ${
            isDark ? 'bg-[#0D1A16] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
          }`}
        >
          <Text
            className={`text-xl font-urbanist-bold mb-2 text-center ${
              isDark ? 'text-white' : 'text-textDark'
            }`}
          >
            Complete your bio
          </Text>
          <Text
            className={`text-sm mb-5 text-center ${
              isDark ? 'text-textSecondary' : 'text-textMuted'
            }`}
          >
            Add a short bio so clients can get to know you better before booking.
          </Text>

          <View className="gap-3">
            <Button text="Edit Bio Now" onPress={handleEditBioNow} variant="gradient" />
            <Button
              text="Maybe Later"
              onPress={() => setShowBioPrompt(false)}
              variant="light"
              className="rounded-[14px]"
            />
          </View>
        </ModalWrapper>
      </View>
    </GradientBackground>
  );
};

export default Dashboard;
