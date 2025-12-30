import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useGetPendingReviews } from '@/api/user/consultation/useGetPendingReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useConsultations } from '@/hooks/useConsultations';

import GradientBackground from '@/common/components/GradientBackground';
import ConversationSkeleton from '@/common/components/skeletons/ConversationSkeleton';
import ConversationItem from '@/components/chat/ConversationItem';
import ChatHomeHeader from '@/components/chat/ChatHomeHeader';
import type {
  AppStackParamList,
  ConsultationStackParamList,
  ConversationPreview,
} from '@/common/types';
import { createPreview, filterConversations } from '@/utils/consultationUtils';

type NavParamList = AppStackParamList & ConsultationStackParamList;

const CustomerChatHome: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const navigation = useNavigation<NativeStackNavigationProp<NavParamList>>();

  const userKey = useMemo(() => (user?.id ? String(user.id) : null), [user?.id]);
  const [searchQuery, setSearchQuery] = useState('');

  const { consultations, loading, refreshing, isRealtimeConnected, refreshConversations } =
    useConsultations({ userKey });

  const previews: ConversationPreview[] = useMemo(
    () => consultations.filter((c) => c.status !== 'cancelled').map((c) => createPreview(c)),
    [consultations]
  );

  const filteredConvos = useMemo(
    () => filterConversations(previews, searchQuery),
    [previews, searchQuery]
  );

  const { data: pendingReviews } = useGetPendingReviews();
  console.log('pendingReviews', pendingReviews);

  return (
    <GradientBackground className="flex-1">
      <View className="flex-1">
        <ChatHomeHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isRealtimeConnected={isRealtimeConnected}
        />

        {loading && consultations.length === 0 ? (
          <View className="flex-1 px-5 mb-8 mt-4">
            <View>
              {[...Array(8)].map((_, i) => (
                <ConversationSkeleton key={i} />
              ))}
            </View>
          </View>
        ) : (
          <View className="flex-1 px-5 mb-8 mt-4">
            <FlashList
              data={filteredConvos}
              keyExtractor={(item: ConversationPreview) => item.id.toString()}
              renderItem={({ item }) => (
                <ConversationItem
                  item={item}
                  onPress={() =>
                    navigation.navigate('ConsultantChat', {
                      consultationId: item.id,
                      asCustomer: true,
                    })
                  }
                />
              )}
              showsVerticalScrollIndicator={false}
              onRefresh={refreshConversations}
              refreshing={refreshing}
              ListEmptyComponent={() => (
                <View className="flex-1 items-center justify-center mt-14 px-10">
                  <Text className={`${isDark ? 'text-white' : 'text-textMuted'} text-base mb-1`}>
                    No consultations yet
                  </Text>
                  <Text
                    className={`${isDark ? 'text-white' : 'text-textMuted'} text-xs text-center`}
                  >
                    Start a new consultation to begin chatting with a stylist.
                  </Text>
                </View>
              )}
              contentContainerStyle={{ paddingVertical: 4, paddingBottom }}
            />
          </View>
        )}
      </View>
    </GradientBackground>
  );
};

export default CustomerChatHome;
