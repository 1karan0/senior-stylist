import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ModalWrapper } from '../ModalWrapper';
import { ConsultantConsultation } from '@/api/consultant/consultations';
import Button from '../Button';
import ImageModal from '@/common/components/modals/ImageModal';

interface ConsultantDetailsProps {
  visible: boolean;
  onClose: () => void;
  consultation: ConsultantConsultation | null;
  isConsultant?: boolean;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const ConsultantDetails: React.FC<ConsultantDetailsProps> = ({
  visible,
  onClose,
  consultation,
  isConsultant = false,
}: ConsultantDetailsProps) => {
  const [showImageModal, setShowImageModal] = useState(false);

  const handleShowImageModal = () => {
    setShowImageModal(true);
  };

  if (!consultation) {
    return null;
  }

  const personProfile = isConsultant ? consultation.user : consultation.consultant;
  const isShowingConsultant = !isConsultant;

  if (!personProfile) {
    return null;
  }

  const consultantDetails = isShowingConsultant
    ? (personProfile.consultant_details as
        | {
            specialization?: string;
            bio?: string;
            years_experience?: number;
            average_rating?: string | number;
            total_sessions?: number;
          }
        | null
        | undefined)
    : null;

  const specialization = consultantDetails?.specialization;
  const bio = consultantDetails?.bio;
  const yearsExperience = consultantDetails?.years_experience;
  const averageRating = consultantDetails?.average_rating;
  const totalSessions = consultantDetails?.total_sessions;

  const hasRating = averageRating && parseFloat(averageRating.toString()) > 0;
  const hasSessions = totalSessions && totalSessions > 0;

  return (
    <ModalWrapper visible={visible} onClose={onClose} containerClassName="px-2 py-4">
      <View className="" style={{ position: 'relative' }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="flex-row justify-end">
            <TouchableOpacity onPress={onClose}>
              <Text>
                <Ionicons name="close" size={24} color="#162721" />
              </Text>
            </TouchableOpacity>
          </View>
          {/* Header */}
          <View className="flex-row items-center justify-start mb-4 px-4 ">
            <TouchableOpacity onPress={onClose} className="">
              <Text>
                <Ionicons name="arrow-back" size={24} color="#162721" />
              </Text>
            </TouchableOpacity>
            <Text className="text-[18px] w-[90%] text-center font-urbanist-bold text-textDark">
              {personProfile.name || ''}
            </Text>
          </View>

          {/* Profile Image */}
          <View className="px-4 h-[225px]">
            {personProfile.profile_picture_url ? (
              <TouchableOpacity
                onPress={() => {
                  handleShowImageModal();
                }}
              >
                <View className="w-full h-full rounded-[10px] overflow-hidden bg-gray-100 items-center justify-center">
                  <Image
                    source={{ uri: personProfile.profile_picture_url }}
                    className="w-full h-full rounded-[10px]"
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <View className="w-full h-[225px] rounded-[10px] bg-buttonPrimaryBg items-center justify-center">
                <Text className="text-white text-5xl font-urbanist-bold">
                  {personProfile.name ? getInitials(personProfile.name) : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Name and Details */}
          <View className="px-4 mt-4">
            <Text className="text-[22px] font-urbanist-bold text-textDark">
              {personProfile.name || ''}
            </Text>

            {isShowingConsultant && specialization && (
              <Text className="text-sm text-textMuted mt-1">{specialization}</Text>
            )}

            {!isShowingConsultant && personProfile.email && (
              <Text className="text-sm text-textMuted mt-1">{personProfile.email}</Text>
            )}

            {/* Rating - Only show for consultants */}
            {isShowingConsultant && hasRating && averageRating && (
              <View className="flex-row items-center mt-2">
                <Text>
                  <Ionicons name="star" size={17} color="#FFD700" />
                </Text>
                <Text className="text-[14px] ml-1 font-poppins-medium text-textDark">
                  {`${
                    typeof averageRating === 'number'
                      ? averageRating.toFixed(1)
                      : parseFloat(String(averageRating)).toFixed(1)
                  } (${totalSessions || 0} reviews)`}
                </Text>
              </View>
            )}

            {/* Stats Row - Show different info for consultants vs users */}
            {isShowingConsultant ? (
              (hasSessions || yearsExperience) && (
                <View className="mt-4">
                  {hasSessions && (
                    <View className="flex-row items-center mb-2">
                      <Text>
                        <Ionicons name="people-outline" size={18} color="#162721" />
                      </Text>
                      <Text className="text-sm text-textDark ml-2">
                        {totalSessions} consultations
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center mb-2">
                    <Text>
                      <Ionicons name="time-outline" size={18} color="#162721" />
                    </Text>
                    <Text className="text-sm text-textDark ml-2">responds in less than a day</Text>
                  </View>

                  <View className="flex-row items-center mb-2">
                    <Text>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#162721" />
                    </Text>
                    <Text className="text-sm text-textDark ml-2">93% response rate</Text>
                  </View>

                  <View className="flex-row items-center mb-2">
                    <Text>
                      <Ionicons name="eye-outline" size={18} color="#162721" />
                    </Text>
                    <Text className="text-sm text-textDark ml-2">1677 profile views</Text>
                  </View>

                  {yearsExperience && yearsExperience > 0 && (
                    <View className="flex-row items-center mb-2">
                      <Text>
                        <Ionicons name="briefcase-outline" size={18} color="#162721" />
                      </Text>
                      <Text className="text-sm text-textDark ml-2">
                        {yearsExperience} years experience
                      </Text>
                    </View>
                  )}
                </View>
              )
            ) : (
              <View className="mt-4">
                <View className="flex-row items-center mb-2">
                  <Text>
                    <Ionicons name="person-outline" size={18} color="#162721" />
                  </Text>
                  <Text className="text-sm text-textDark ml-2">Client</Text>
                </View>
                {consultation.problem_description && (
                  <View className="mt-3">
                    <Text className="text-sm font-urbanist-semibold text-textDark mb-1">
                      Consultation Request
                    </Text>
                    <Text className="text-sm text-textMuted leading-5">
                      {consultation.problem_description}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* About Me - Only show for consultants */}
          {isShowingConsultant && bio && (
            <View className="px-4 mt-6">
              <Text className="text-lg font-urbanist-bold mb-2 text-textDark">About Me</Text>
              <Text className="text-sm leading-6 text-textDark">{bio}</Text>
            </View>
          )}

          {/* Reviews - Only show for consultants */}
          {isShowingConsultant && hasRating && averageRating && (
            <View className="px-4 mt-2">
              {/* Sample Review Card - Replace with actual reviews data */}
              <View className="bg-gray-50 p-4 rounded-xl mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-urbanist-semibold text-textDark">
                    Lyda Loudon Oulfaye
                  </Text>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text key={star}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                      </Text>
                    ))}
                  </View>
                </View>
                <Text className="text-xs text-textMuted mb-2">Nov 13, 2025 at 01:49 AM</Text>
                <Text className="text-sm text-textDark">This is great thank you so much!</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* CTA Button */}
        <View className="absolute bottom-0 left-0 right-0 p-4">
          <Button
            text="Continue To Chat"
            onPress={onClose}
            variant="gradient"
            icon={<Ionicons name="chatbubble-outline" size={20} color="white" />}
          />
        </View>
      </View>
      <ImageModal
        visible={showImageModal}
        imageUri={personProfile.profile_picture_url || ''}
        onClose={() => setShowImageModal(false)}
      />
    </ModalWrapper>
  );
};

export default ConsultantDetails;
