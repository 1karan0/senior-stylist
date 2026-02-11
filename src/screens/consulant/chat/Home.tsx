import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useConsultantConsultations } from '@/hooks/useConsultantConsultations';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import type { AppStackParamList, ConversationPreview } from '@/common/types';
import GradientBackground from '@/common/components/GradientBackground';
import ConversationItem from '@/components/chat/ConversationItem';
import ConsultantChatHomeHeader from '@/components/chat/ConsultantChatHomeHeader';
import { createConsultantPreview, filterConsultantConversations } from '@/utils/consultationUtils';
import ConversationSkeleton from '@/common/components/skeletons/ConversationSkeleton';

type FilterKey = 'all' | 'unread';

const ChatHome: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { paddingBottom } = useTabBarSafePadding();
  const { horizontalPadding } = useTabletLayout();
  const consultantKey = useMemo(() => (user?.id ? String(user.id) : null), [user?.id]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const { consultations, loading, refreshing, isRealtimeConnected, refreshConversations } =
    useConsultantConsultations({ consultantKey });

  const previews: ConversationPreview[] = useMemo(
    () => consultations.map((c) => createConsultantPreview(c)),
    [consultations]
  );

  const filteredConversations = useMemo(
    () => filterConsultantConversations(previews, searchQuery, activeFilter),
    [previews, searchQuery, activeFilter]
  );

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    return (
      <View className="items-center justify-center py-20 px-8">
        <Text
          className={`text-xl font-urbanist-semibold mb-2 ${isDark ? 'text-textWhite' : 'text-textDark'}`}
        >
          No conversations yet
        </Text>
        <Text
          className={`text-center text-sm font-poppins ${isDark ? 'text-textMuted' : 'text-textMuted'}`}
        >
          New chats with your customers will show up here as soon as they start a session with you.
        </Text>
      </View>
    );
  };

  return (
    <GradientBackground className="flex-1">
      <View className="flex-1 pt-6" style={{ paddingBottom, paddingHorizontal: horizontalPadding }}>
        <ConsultantChatHomeHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          isRealtimeConnected={isRealtimeConnected}
        />

        {loading && consultations.length === 0 ? (
          <FlatList
            data={[1, 2, 3, 4, 5, 6, 7, 8]}
            keyExtractor={(item) => String(item)}
            renderItem={() => <ConversationSkeleton />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom }}
          />
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ConversationItem
                item={item}
                onPress={() => navigation.navigate('ConsultantChat', { consultationId: item.id })}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom }}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refreshConversations} />
            }
          />
        )}
      </View>
    </GradientBackground>
  );
};

export default ChatHome;
