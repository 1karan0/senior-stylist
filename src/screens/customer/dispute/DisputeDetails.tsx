import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Alert,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { FlashList } from '@shopify/flash-list';

import { useGetDisputeDetails } from '@/api/user/dispute/useGetDisputeDetails';
import { useSendDisputeMessage } from '@/api/user/dispute/useSendDisputeMessage';
import GradientBackground from '@/common/components/GradientBackground';
import { ProfileStackParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import DisputeDetailsSkeleton from '@/common/components/skeletons/DisputeDetailsSkeleton';
import ChatInput from '@/components/chat/ChatInput';

type DisputeDetailsNavigationProp = StackNavigationProp<ProfileStackParamList, 'DisputeDetails'>;
type DisputeDetailsRouteProp = RouteProp<ProfileStackParamList, 'DisputeDetails'>;

interface Props {
  navigation: DisputeDetailsNavigationProp;
  route: DisputeDetailsRouteProp;
}

interface DisputeMessage {
  id: number;
  message: string;
  created_at: string;
  user_id: number;
  user_name: string;
  user_type: 'customer' | 'admin';
  is_admin: boolean;
}

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

const DisputeDetails: React.FC<Props> = ({ navigation, route }) => {
  const { disputeId } = route.params;
  const { isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const { data, isLoading, error, refetch } = useGetDisputeDetails(disputeId);
  const { mutate: sendMessage, isPending: isSending } = useSendDisputeMessage();

  // Handle different possible API response structures
  // API typically returns: { status, code, message, data: { dispute: {...}, messages: [...] } }
  // or: { status, code, message, data: {...} } where data contains the dispute object
  const dispute = data?.data?.dispute || data?.data || data?.dispute || data;
  const messages: DisputeMessage[] =
    data?.data?.messages || dispute?.messages || dispute?.data?.messages || [];

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSend = (text: string) => {
    if (!text.trim() || isSending) return;

    // Check if dispute is closed/resolved
    if (dispute?.status === 'closed' || dispute?.status === 'resolved') {
      Alert.alert('Dispute Closed', 'You cannot send messages to a closed or resolved dispute.');
      return;
    }

    sendMessage(
      { id: disputeId, message: text.trim() },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (error: any) => {
          console.error('Failed to send message:', error);
          Alert.alert('Error', error?.message || 'Failed to send message. Please try again.');
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    if (isDark) {
      switch (status) {
        case 'in_progress':
          return 'bg-[#FFF3CD] ';
        case 'closed':
        case 'resolved':
          return 'bg-[#D4EDDA]';
        default:
          return 'bg-[#FFF3CD]';
      }
    }
    switch (status) {
      case 'in_progress':
        return 'bg-[#FFF3CD]';
      case 'closed':
      case 'resolved':
        return 'bg-[#D4EDDA]';
      default:
        return 'bg-[#FFF3CD]';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '#856404'; // Yellow for Open
      case 'closed':
      case 'resolved':
        return '#155724'; // Light green for Resolved
      default:
        return '#856404';
    } // Dark text for all status badges
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'Open';
      case 'closed':
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  if (isLoading && !data) {
    return (
      <GradientBackground topOverlayColor="#27B07D">
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
        {/* Header */}
        <View className="px-6 pt-10 pb-5 bg-buttonPrimaryBg rounded-b-2xl">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              onPress={handleBack}
              className="mr-3 p-1"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-urbanist-bold flex-1">Dispute Details</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-24 h-6 rounded-full bg-white/20" />
            <View className="w-20 h-6 rounded-full bg-white/20 ml-2" />
          </View>
        </View>
        <DisputeDetailsSkeleton />
        {/* Message Input Skeleton */}
        <View
          className={`px-4 pt-2 pb-2 mb-16`}
          style={{
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View
            className={`flex-row items-center rounded-[28px] px-4 min-h-[50px] shadow-[0px_0px_14px_3px_#0000001F] ${
              isDark ? 'bg-[#0E1B16]' : 'bg-[#ffffff]'
            }`}
          >
            <View
              className={`flex-1 h-8 rounded-lg ${isDark ? 'bg-[#1E3A33]' : 'bg-[#E0E0E0]'}`}
              style={{ opacity: 0.5 }}
            />
            <View
              className={`ml-2 w-10 h-10 rounded-full ${isDark ? 'bg-[#1E3A33]' : 'bg-[#E0E0E0]'}`}
              style={{ opacity: 0.5 }}
            />
          </View>
        </View>
      </GradientBackground>
    );
  }

  if (error || !dispute) {
    return (
      <GradientBackground topOverlayColor="#27B07D">
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color={isDark ? '#8AA897' : '#94A3B8'} />
          <Text
            className={`text-base font-poppins-regular mt-4 ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
          >
            Failed to load dispute details
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-4 px-6 py-2 bg-buttonPrimaryBg rounded-xl"
          >
            <Text className="text-white font-poppins-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  const disputeIdFormatted = `#DIS-${String(dispute.id).padStart(3, '0')}`;

  return (
    <GradientBackground topOverlayColor="#27B07D">
      <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
      <View className={`flex-1 pb-14 ${Platform.OS === 'ios' ? 'pb-14' : 'pb-16'}`}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        >
          {/* Header */}
          <View className="px-6 pt-10 pb-5 bg-buttonPrimaryBg rounded-b-2xl">
            <View className="flex-row items-center mb-2">
              <TouchableOpacity
                onPress={handleBack}
                className="mr-3 p-1"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-white text-2xl font-urbanist-bold flex-1">Dispute Details</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-white text-sm font-poppins-regular mr-2">
                {dispute.consultation?.consultation_id_formatted}
              </Text>
              <View className={`px-3 py-1 rounded-full  ${getStatusColor(dispute.status)}`}>
                <Text
                  className={`text-xs font-urbanist-semibold ${getStatusTextColor(dispute.status)}`}
                >
                  {getStatusLabel(dispute.status)}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-6 pt-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Consultation Details Section */}
            <View
              className={`rounded-xl p-4 mb-4 border ${
                isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
              }`}
            >
              <Text
                className={`text-base font-poppins-semibold mb-3 ${
                  isDark ? 'text-white' : 'text-textDark'
                }`}
              >
                Consultation Details
              </Text>
              <View>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-sm font-poppins-regular mb-2 ${
                      isDark ? 'text-white' : 'text-textDark'
                    }`}
                  >
                    Consultation ID
                  </Text>
                  <Text
                    className={`text-sm font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
                  >
                    {dispute.consultation?.consultation_id_formatted}
                  </Text>
                </View>
                <View
                  className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-2`}
                />
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-sm font-poppins-regular mb-2 ${
                      isDark ? 'text-white' : 'text-textDark'
                    }`}
                  >
                    Date
                  </Text>
                  <Text
                    className={`text-sm font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
                  >
                    {dispute.created_at ? formatDateTime(dispute.created_at).date : 'N/A'}
                  </Text>
                </View>
                <View
                  className={`${isDark ? 'bg-commonGradientStop7' : 'bg-[#DAE7E0]'} w-full h-[1px] mb-2`}
                />
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-sm font-poppins-regular ${
                      isDark ? 'text-white' : 'text-textDark'
                    }`}
                  >
                    Stylist
                  </Text>
                  <Text
                    className={`text-sm font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
                  >
                    {dispute.consultant?.name || 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Conversation Section */}
            <View className={`rounded-xl  mb-4 `}>
              <Text
                className={`text-base font-poppins-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-textDark'
                }`}
              >
                Conversation
              </Text>

              {messages.length === 0 ? (
                <Text
                  className={`text-sm font-poppins-regular text-center py-4 ${
                    isDark ? 'text-textSecondary' : 'text-textMuted'
                  }`}
                >
                  No messages yet
                </Text>
              ) : (
                <View>
                  {messages.map((msg) => {
                    const isUser = msg.is_admin === false || msg.user_id === user?.id;
                    const { time } = formatDateTime(msg.created_at);

                    return (
                      <View key={msg.id} className={`my-1 ${isUser ? 'items-end' : 'items-start'}`}>
                        <View
                          className={`w-full p-3 border rounded-xl ${
                            isUser
                              ? `${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0] '} `
                              : `${isDark ? 'bg-[#233931] border-[#27B07D]' : 'bg-[#E2F2EA] border-[#27B07D]'} `
                          }`}
                        >
                          <View className="flex-row items-center justify-between">
                            <Text
                              className={`text-base font-poppins-semibold ${isDark ? 'text-white' : 'text-textDark'}`}
                            >
                              {isUser ? 'You' : 'Admin'}
                            </Text>
                            <View className="flex-row items-center mt-1 gap-1">
                              <Text
                                className={`text-[10px] ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                              >
                                {time}
                              </Text>
                            </View>
                          </View>
                          <Text
                            className={`text-sm font-poppins-regular leading-5 
                             ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                          >
                            {msg.message}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Message Input */}

          <ChatInput
            onSend={(text) => handleSend(text)}
            disabled={isSending || dispute?.status === 'closed' || dispute?.status === 'resolved'}
            placeholder={
              dispute?.status === 'closed' || dispute?.status === 'resolved'
                ? 'Dispute is closed'
                : 'Type your reply...'
            }
          />
        </KeyboardAvoidingView>
      </View>
    </GradientBackground>
  );
};

export default DisputeDetails;
