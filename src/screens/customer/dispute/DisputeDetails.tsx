import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
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
  const [message, setMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const { data, isLoading, error, refetch } = useGetDisputeDetails(disputeId);
  const { mutate: sendMessage, isPending: isSending } = useSendDisputeMessage();

  // Handle different possible API response structures
  // API typically returns: { status, code, message, data: { dispute: {...}, messages: [...] } }
  // or: { status, code, message, data: {...} } where data contains the dispute object
  const dispute = data?.data?.dispute || data?.data || data?.dispute || data;
  const messages: DisputeMessage[] =
    data?.data?.messages || dispute?.messages || dispute?.data?.messages || [];

  // Debug logging (remove in production)
  if (__DEV__ && data) {
    console.log('Dispute Details API Response:', JSON.stringify(data, null, 2));
    console.log('Extracted Dispute:', dispute);
    console.log('Extracted Messages:', messages);
  }

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

  const handleSend = () => {
    if (!message.trim() || isSending) return;

    const messageText = message.trim();
    setMessage('');

    sendMessage(
      { id: disputeId, message: messageText },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (error: any) => {
          console.error('Failed to send message:', error);
          // Optionally show error alert
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    if (isDark) {
      switch (status) {
        case 'in_progress':
          return 'bg-yellow-500/20 border-yellow-500/50';
        case 'closed':
        case 'resolved':
          return 'bg-green-500/20 border-green-500/50';
        default:
          return 'bg-gray-500/20 border-gray-500/50';
      }
    }
    switch (status) {
      case 'in_progress':
        return 'bg-yellow-100 border-yellow-400';
      case 'closed':
      case 'resolved':
        return 'bg-green-100 border-green-400';
      default:
        return 'bg-gray-100 border-gray-400';
    }
  };

  const getStatusTextColor = (status: string) => {
    if (isDark) {
      switch (status) {
        case 'in_progress':
          return 'text-yellow-400';
        case 'closed':
        case 'resolved':
          return 'text-green-400';
        default:
          return 'text-gray-400';
      }
    }
    switch (status) {
      case 'in_progress':
        return 'text-yellow-700';
      case 'closed':
      case 'resolved':
        return 'text-green-700';
      default:
        return 'text-gray-700';
    }
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
      <GradientBackground>
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#27B07D" />
        </View>
      </GradientBackground>
    );
  }

  if (error || !dispute) {
    return (
      <GradientBackground>
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <GradientBackground>
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
            <Text className="text-white text-sm font-poppins-regular mr-2">
              {disputeIdFormatted}
            </Text>
            <View className={`px-3 py-1 rounded-full border ${getStatusColor(dispute.status)}`}>
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
              isDark
                ? 'bg-commonGradientStop6 border-commonGradientStop7'
                : 'bg-white border-[#DAE7E0]'
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
              <Text
                className={`text-sm font-poppins-regular mb-2 ${
                  isDark ? 'text-white' : 'text-textDark'
                }`}
              >
                Consultation ID{' '}
                {dispute.consultation_id_formatted ||
                  (dispute.consultation_id ? `#CONS-${dispute.consultation_id}` : 'N/A')}
              </Text>
              <Text
                className={`text-sm font-poppins-regular mb-2 ${
                  isDark ? 'text-white' : 'text-textDark'
                }`}
              >
                Date {dispute.created_at ? formatDateTime(dispute.created_at).date : 'N/A'}
              </Text>
              <Text
                className={`text-sm font-poppins-regular ${
                  isDark ? 'text-white' : 'text-textDark'
                }`}
              >
                Stylist {dispute.consultant?.name || 'Unknown'}
              </Text>
            </View>
          </View>

          {/* Conversation Section */}
          <View
            className={`rounded-xl p-4 mb-4 border ${
              isDark
                ? 'bg-commonGradientStop6 border-commonGradientStop7'
                : 'bg-white border-[#DAE7E0]'
            }`}
          >
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
                  const isUser = msg.user_type === 'customer' || msg.user_id === user?.id;
                  const { date, time } = formatDateTime(msg.created_at);
                  const displayName = isUser ? 'You' : msg.user_name || 'Admin';

                  return (
                    <View key={msg.id} className="mb-4">
                      <Text
                        className={`text-xs font-poppins-semibold mb-1 ${
                          isUser ? 'text-buttonPrimaryBg' : isDark ? 'text-white' : 'text-textDark'
                        }`}
                      >
                        {displayName}
                      </Text>
                      <Text
                        className={`text-xs font-urbanist-regular mb-2 ${
                          isDark ? 'text-textSecondary' : 'text-textMuted'
                        }`}
                      >
                        {date}, {time}
                      </Text>
                      <View
                        className={`rounded-lg p-3 ${
                          isUser
                            ? isDark
                              ? 'bg-buttonPrimaryBg/20'
                              : 'bg-buttonPrimaryBg/10'
                            : isDark
                              ? 'bg-commonGradientStop7/50'
                              : 'bg-[#F5F9F7]'
                        }`}
                      >
                        <Text
                          className={`text-sm font-poppins-regular ${
                            isDark ? 'text-white' : 'text-textDark'
                          }`}
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
        <View
          className={`px-4 pt-2 pb-4 border-t ${
            isDark
              ? 'bg-commonGradientStop6 border-commonGradientStop7'
              : 'bg-white border-[#DAE7E0]'
          }`}
          style={{
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View
            className={`flex-row items-center rounded-[28px] px-4 min-h-[50px] ${
              isDark ? 'bg-commonGradientStop7' : 'bg-[#F5F9F7]'
            }`}
          >
            <TextInput
              className={`flex-1 ${isDark ? 'text-white' : 'text-textDark'} text-[15px] max-h-[100px] py-2`}
              style={{
                textAlignVertical: 'center',
                includeFontPadding: false,
              }}
              value={message}
              onChangeText={setMessage}
              placeholder="Type your reply..."
              placeholderTextColor="#A1A1A1"
              multiline
              maxLength={2000}
              editable={!isSending}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={!message.trim() || isSending}
              className={`ml-2 w-10 h-10 rounded-full justify-center items-center ${
                message.trim() && !isSending ? 'bg-buttonPrimaryBg' : 'bg-gray-300'
              }`}
              activeOpacity={0.7}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </GradientBackground>
    </KeyboardAvoidingView>
  );
};

export default DisputeDetails;
