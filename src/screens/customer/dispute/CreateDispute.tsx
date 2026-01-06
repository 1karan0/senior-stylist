import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGetDisputeConsultations } from '@/api/user/dispute/useGetDisputeConsultations';
import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { ProfileStackParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import { ConsultationListSkeleton } from '@/common/components/skeletons/ConsultationItemSkeleton';

type CreateDisputeNavigationProp = StackNavigationProp<ProfileStackParamList, 'CreateDispute'>;

interface Props {
  navigation: CreateDisputeNavigationProp;
}

interface Consultation {
  id: number;
  stylist: {
    id: number;
    name: string;
    email: string;
    profile_picture_url: string | null;
    consultant_details: {
      id: number;
      specialization: string | null;
      bio: string | null;
      years_experience: number;
      average_rating: number;
    } | null;
  } | null;
  completed_at: string;
  problem_description: string;
  image_public_url: string | null;
}

const CreateDispute: React.FC<Props> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { data, isLoading, error } = useGetDisputeConsultations();
  const [selectedConsultationId, setSelectedConsultationId] = useState<number | null>(null);

  const consultations: Consultation[] = data?.data.consultations || [];

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string): { date: string; time: string } => {
    try {
      const date = new Date(dateString);
      const dateStr = date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return { date: dateStr, time: timeStr };
    } catch {
      return { date: dateString, time: '' };
    }
  };

  const handleNext = () => {
    if (!selectedConsultationId) {
      Alert.alert('Selection Required', 'Please select a consultation to dispute.');
      return;
    }
    // Navigate to SubmitDispute with selected consultation ID
    navigation.navigate('SubmitDispute', { consultationId: selectedConsultationId });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
        {/* Header Section with Green Background */}
        <View className="px-6 pt-10 pb-5 bg-buttonPrimaryBg rounded-b-2xl">
          <Text className="text-white text-2xl font-urbanist-bold">Create Dispute</Text>
          <Text className="text-white  font-poppins-regular opacity-90">
            Report an issue with your consultation
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-6 pb-24">
            {/* Step 1 Section */}
            <View className="mb-6">
              <Text
                className={`text-base font-poppins-semibold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                Step 1: Select Consultation
              </Text>
              <Text
                className={` font-poppins-regular ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
              >
                Choose the consultation you want to dispute
              </Text>
            </View>

            {/* Recent Consultations */}
            <Text
              className={`text-base font-poppins-semibold mb-4 ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Recent Consultations
            </Text>

            <ConsultationListSkeleton />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <View className="flex-1">
        <GradientBackground>
          <View className="flex-1 justify-center items-center px-4">
            <Text className={`text-lg ${isDark ? 'text-white' : 'text-textDark'} text-center`}>
              Failed to load consultations. Please try again.
            </Text>
          </View>
        </GradientBackground>
      </View>
    );
  }

  return (
    <GradientBackground>
      <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
      {/* Header Section with Green Background */}
      <View className="px-6 pt-10 pb-5 bg-buttonPrimaryBg rounded-b-2xl">
        <Text className="text-white text-2xl font-urbanist-bold">Create Dispute</Text>
        <Text className="text-white  font-poppins-regular opacity-90">
          Report an issue with your consultation
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-24">
          {/* Step 1 Section */}
          <View className="mb-6">
            <Text
              className={`text-base font-poppins-semibold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Step 1: Select Consultation
            </Text>
            <Text
              className={` font-poppins-regular ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              Choose the consultation you want to dispute
            </Text>
          </View>

          {/* Recent Consultations */}
          <Text
            className={`text-base font-poppins-semibold mb-4 ${isDark ? 'text-white' : 'text-textDark'}`}
          >
            Recent Consultations
          </Text>

          {consultations.length === 0 ? (
            <View
              className={`rounded-xl p-6 mb-4 ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} border`}
            >
              <Text className={`text-center ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}>
                No consultations available for dispute.
              </Text>
            </View>
          ) : (
            consultations.map((consultation) => {
              const isSelected = selectedConsultationId === consultation.id;
              const consultant = consultation.stylist;
              const dateTime = formatDateTime(consultation.completed_at);
              const bookingDate = formatDate(consultation.completed_at);

              return (
                <TouchableOpacity
                  key={consultation.id}
                  onPress={() => setSelectedConsultationId(consultation.id)}
                  className={`rounded-[10px] p-4 mb-4 border-2 ${
                    isSelected && isDark
                      ? 'border-[#27B07D] bg-[#233931]'
                      : isSelected && !isDark
                        ? 'border-[#27B07D] bg-[#E2F2EA]'
                        : isDark
                          ? 'bg-buttonSecondaryText border-commonGradientStop7'
                          : 'bg-white border-[#DAE7E0]'
                  }`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-4">
                      <View className="flex-row justify-between items-start mb-1">
                        <View>
                          <Text
                            className={`text-lg font-poppins-semibold ${
                              isDark ? 'text-white' : 'text-textDark'
                            }`}
                          >
                            {consultation.problem_description.slice(0, 20) || 'Consultation'}
                          </Text>
                          <Text className="text-[#27B07D] text-sm font-poppins-semibold mb-1">
                            #{`CONS-${consultation.id}`}
                          </Text>
                          <Text
                            className={`text-xs font-urbanist-semibold mb-2 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                          >
                            {bookingDate}
                          </Text>
                        </View>
                        {/* Logo */}
                        <View className="">
                          <Image
                            source={
                              isDark
                                ? require('@/assets/icons/dark-logo.png')
                                : require('@/assets/icons/colored_logo.png')
                            }
                            className="w-10 h-10"
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                      <View
                        className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-2`}
                      />

                      <View className="flex-row justify-between items-start">
                        <View>
                          <Text
                            className={`text-sm font-urbanist-bold mb-1 ${isDark ? 'text-white' : 'text-textDark'}`}
                          >
                            Date:{' '}
                            <Text className="font-poppins-regular text-textMuted text-xs">
                              {dateTime.date}
                            </Text>
                          </Text>
                          {consultant && (
                            <Text
                              className={`text-sm font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
                            >
                              Stylist:{' '}
                              <Text className="font-poppins-regular text-textMuted text-xs">
                                {consultant.name}
                              </Text>
                            </Text>
                          )}
                        </View>
                        <Text
                          className={`text-sm font-urbanist-bold mb-1 ${isDark ? 'text-white' : 'text-textDark'}`}
                        >
                          Time:{' '}
                          <Text className="font-poppins-regular text-textMuted text-xs">
                            {dateTime.time}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Information Note */}
          <View
            className={`rounded-[10px] px-5 py-3 mt-4 mb-6  bg-[#C3DFFB] border border-[#DAE7E0] flex-row items-center justify-between gap-2`}
          >
            <View className=" -ml-2">
              <Image
                source={require('@/assets/icons/info.png')}
                className="w-5 h-5 "
                resizeMode="contain"
              />
            </View>
            <View className="">
              <Text className="text-sm font-urbanist-regular  text-[#004085]">
                <Text className="font-urbanist-bold">Note:</Text> You can only dispute consultations
                from the last 30 days. If you don't see the consultation you're looking for, please
                contact support.
              </Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Button
                text="Cancel"
                onPress={handleCancel}
                variant="light"
                className={`${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} border rounded-xl`}
                textClassName={isDark ? 'text-white' : 'text-textDark'}
              />
            </View>
            <View className="flex-1">
              <Button
                text="Next"
                onPress={handleNext}
                variant="gradient"
                disabled={!selectedConsultationId}
                className="rounded-xl"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
    </GradientBackground>
  );
};

export default CreateDispute;
