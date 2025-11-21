import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, FlatList } from 'react-native';
import { useGetConsultation } from '@/api/user/consultation/usegetconsultation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { ConsultationItem } from '@/common/types';
import GradientBackground from '@/common/components/GradientBackground';

export interface ChatProps {
  data: ConsultationItem[];
  isLoading: boolean;
}

dayjs.extend(relativeTime);

const ACTIVE_STATUSES = ['assigned'];

const Chat: React.FC<ChatProps> = ({ data, isLoading }) => {
  const [search, setSearch] = useState('');

  const { isDark } = useTheme();
  // unwrap API structure

  // keep only active ones
  const activeChats = data?.filter((item: any) => ACTIVE_STATUSES.includes(item.status));
  // apply search
  const filteredChats = activeChats?.filter((item: any) => {
    const name = item?.consultant?.name?.toLowerCase() || '';
    const problem = item?.problem_description?.toLowerCase() || '';
    const term = search.toLowerCase();

    return name.includes(term) || problem.includes(term);
  });

  const renderChat = ({ item }: any) => {
    const lastMsg = item.messages?.[item.messages.length - 1];
    const unread = item.messages?.filter((m: any) => !m.read).length || 0;

    return (
      <TouchableOpacity className="bg-white shadow-sm border border-[#DAE7E0] rounded-xl px-4 py-4 mb-2 flex-row items-center">
        {/* Avatar */}
        <View className="mr-4">
          <Image
            source={require('@/assets/avatar.png')}
            className="w-12 h-12 rounded-full"
            resizeMode="contain"
          />
          <View className="w-3 h-3 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-white" />
        </View>

        {/* Text */}
        <View className="flex-1">
          <Text className={`font-semibold text-base text-[#162721] capitalize`}>
            {item?.consultant?.name || 'Unknown Consultant'}
          </Text>

          <Text className={`text-[#658176]`} numberOfLines={1}>
            {lastMsg?.message ?? item.problem_description}
          </Text>
        </View>

        {/* Time + Unread */}
        <View className="items-end ml-2">
          <Text className={`text-[#9EA3AE] font-medium text-xs`}>
            {dayjs(item.updated_at).fromNow()}
          </Text>

          {unread > 0 && (
            <View className={`bg-[#27B07D] w-6 h-6 rounded-full justify-center items-center mt-2`}>
              <Text className="text-white font-semibold text-sm">{unread}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GradientBackground>
      <View className="flex-1 ">
        {/* Header */}

        <View className="">
          <LinearGradient
            colors={['#2CCB91', '#23A76F']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
            className="px-5 pt-12 pb-5 "
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-2xl font-urbanist font-bold">Consultations</Text>

              <TouchableOpacity className="bg-yellow-300 px-4 py-2 rounded-full">
                <Text className="font-semibold text-green-700">+ New</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-white opacity-90 mb-4">Manage your styling sessions</Text>

            {/* Search */}
            <View
              className={`flex-row items-center border border-[#DADADA] bg-white rounded-xl px-3 py-2 mb-5`}
            >
              <Image source={require('../../../assets/search-icon.png')} className="w-5 h-5 mr-3" />
              <TextInput
                placeholder="Search conversations..."
                placeholderTextColor="#658176"
                value={search}
                onChangeText={setSearch}
                className="text-base"
              />
            </View>
          </LinearGradient>
        </View>

        {/* List */}
        <View className="flex-1 px-5 mt-4">
          {isLoading ? (
            <Text className="text-center text-gray-500 mt-10">Loading...</Text>
          ) : (
            <FlatList
              data={filteredChats}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={renderChat}
              ListEmptyComponent={() => (
                <Text className="text-center mt-10 text-gray-400">No active consultations</Text>
              )}
            />
          )}
        </View>
      </View>
    </GradientBackground>
  );
};

export default Chat;
