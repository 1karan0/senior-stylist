import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { AppButton } from '@/common/components/Button'; // Adjust import path as needed
import LinearGradient from 'react-native-linear-gradient';

export interface RequestItem {
  id: number;
  initials: string;
  name: string;
  time: string;
  hasAttachment: boolean;
  attachmentName?: string;
  requirements: string;
}

export interface ListProps {
  requests: RequestItem[];
  onAcceptRequest: (requestId: number) => void;
  onViewDetails: (request: RequestItem) => void; // New prop for viewing details
}

const List: React.FC<ListProps> = ({ requests, onAcceptRequest, onViewDetails }) => {
  return (
    <ScrollView className="flex-1 pt-4 px-2">
      {requests.map((request) => (
        <View key={request.id} className="bg-white rounded-xl border border-[#DAE7E0] p-4 mb-4">
          {/* Client Header */}
          <View className="flex-row items-start mb-4">
            <View className="w-14 h-14 rounded-full items-center justify-center mr-3 overflow-hidden">
              <LinearGradient
                colors={['#27B07D', '#36D399']}
                className="w-full h-full items-center justify-center"
              >
                <Text className="text-white font-urbanist font-semibold text-xl">
                  {request.initials}
                </Text>
              </LinearGradient>
            </View>
            <View className="flex-1">
              {request.hasAttachment && (
                <View className="bg-[#DAE7E0] px-2 py-1 rounded-full self-start flex-row items-center">
                  <Image
                    source={require('@/assets/icons/photo.png')}
                    className="w-3 h-3 mr-1"
                    resizeMode="contain"
                  />
                  <Text className="font-urbanist font-bold text-[#161616] text-xs">
                    {request.attachmentName}
                  </Text>
                </View>
              )}
              <Text className="text-[#162721] text-xl font-urbanist font-semibold">
                {request.name}
              </Text>
              <Text className="text-[#658176] font-poppins text-sm">{request.time}</Text>

              {/* Clickable Requirements View */}
              <TouchableOpacity
                className="flex flex-row items-center px-2 py-1 border border-[#DAE7E0] rounded-lg self-start mt-2"
                onPress={() => {
                  console.log('hit for modal');
                  onViewDetails(request);
                }}
              >
                <Image
                  source={require('@/assets/icons/dark-note.png')}
                  className="w-3 h-3 mr-1"
                  resizeMode="contain"
                />
                <Text className="font-poppins text-black text-sm">Requirements:</Text>
                <Image
                  source={require('@/assets/icons/right-arrow.png')}
                  className="w-3 h-3 ml-1"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button - Using AppButton */}
          <AppButton
            text="Accept Request"
            onPress={() => onAcceptRequest(request.id)}
            variant="gradient"
            className="w-full"
          />
        </View>
      ))}
    </ScrollView>
  );
};

export default List;
