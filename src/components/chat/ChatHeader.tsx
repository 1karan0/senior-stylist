import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, StatusBar } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

import type { ConsultantConsultation } from '@/api/consultant/consultations';

interface ChatHeaderProps {
  consultation: ConsultantConsultation;
  onBack: () => void;
  onFinish?: () => void;
  isConsultant?: boolean;
  isConnecting?: boolean;
  isLoading?: boolean;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const ChatHeader: React.FC<ChatHeaderProps> = ({
  consultation,
  onBack,
  onFinish,
  isConsultant = true,
  isConnecting = false,
  isLoading = false,
}) => {
  const otherPerson = isConsultant ? consultation.user : consultation.consultant;
  const otherPersonName = otherPerson?.name || (isConsultant ? 'Client' : 'Stylist');
  const consultantDetails = consultation.consultant?.consultant_details as
    | { specialization?: string }
    | null
    | undefined;
  const specialization = consultantDetails?.specialization;

  return (
    <View>
      <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
      <View className="bg-[#27B07D] pt-12 pb-4 px-4 rounded-b-3xl">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={onBack}
            className="mr-3 p-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {otherPerson?.profile_picture_url ? (
            <Image
              source={{ uri: otherPerson.profile_picture_url }}
              className="w-12 h-12 rounded-full mr-3"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-white/20 justify-center items-center mr-3">
              <Text className="text-white text-base font-semibold">
                {getInitials(otherPersonName)}
              </Text>
            </View>
          )}
          <View>
            <View className="flex-1 items-center">
              <Text className="text-base  font-semibold text-white">{otherPersonName}</Text>
              {specialization ? (
                <View className="px-2 py-1 bg-[#658176] rounded-xl">
                  <Text className="text-xs font-bold text-white ">{specialization ?? ''}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* {onFinish && consultation.status !== 'completed' && ( */}
          <TouchableOpacity
            onPress={onFinish}
            className="flex-row absolute right-1 items-center bg-white px-3 py-1.5 rounded-xl gap-1.5"
          >
            <Image source={require('@/assets/icons/finish.png')} />
            <Text className=" text-sm font-semibold">Finish</Text>
          </TouchableOpacity>
          {/* )} */}

          {consultation.status === 'completed' && (
            <View className="flex-row absolute right-1 items-center bg-white/20 px-3 py-1.5 rounded-lg gap-1.5">
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text className="text-white text-sm font-medium">Completed</Text>
            </View>
          )}
        </View>

        {(isConnecting || isLoading) && (
          <View
            className={`flex-row items-center justify-center mt-1.5 rounded-full px-2.5 py-0.5 self-start ${
              isConnecting ? 'bg-[#FFE08A]' : 'bg-white/25'
            }`}
          >
            {isConnecting ? (
              <>
                <Ionicons name="warning" size={14} color="#3A2F00" className="mr-1.5" />
                <Text className="text-[#3A2F00] text-xs font-semibold">
                  Offline. Waiting for connection…
                </Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="small" color="#1C1C1C" style={{ marginRight: 6 }} />
                <Text className="text-[#1C1C1C] text-xs font-medium">Loading messages…</Text>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default ChatHeader;
