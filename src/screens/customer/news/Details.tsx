import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NewsStackParamList } from '@/common/types';
import GradientBackground from '@/common/components/GradientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RenderHTML from 'react-native-render-html';
import { useTheme } from '@/contexts/ThemeContext';
import { useGetNewsDetail } from '@/api/user/news/useGetNewsDetail';

// simple relative time formatter (avoids adding a new dependency)
const formatRelativeTime = (iso?: string | null) => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return iso;
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

  return new Date(iso).toLocaleDateString();
};

const Details: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<NewsStackParamList, 'NewsDetail'>>();
  const { slug } = route.params;
  const { isDark } = useTheme();

  const { width } = useWindowDimensions();

  const { data: article, isLoading, isError } = useGetNewsDetail(slug);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#00C896" />
      </View>
    );
  }

  if (isError || !article) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Unable to load article.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GradientBackground style={{ flex: 1 }}>
        <View className="flex-1 px-5 mt-5">
          {/* Top Bar */}
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="">
              <Image
                source={
                  isDark
                    ? require('@/assets/icons/green-back.png')
                    : require('@/assets/icons/back.png')
                }
              />
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity>
                <Image
                  source={
                    isDark
                      ? require('@/assets/icons/white-share.png')
                      : require('@/assets/icons/share.png')
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  source={
                    isDark
                      ? require('@/assets/icons/white-save.png')
                      : require('@/assets/icons/save.png')
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingBottom: 120,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text
              className={`text-xl font-semibold  ${isDark ? 'text-white' : 'text-[#162721]'} mb-2 leading-snug`}
            >
              {}
            </Text>

            {/* Info Row */}
            <View className="flex-row items-center gap-2 mb-1">
              <Image source={require('@/assets/icons/green-user.png')} className="w-5 h-5" />
              <Text className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} `}>
                {article.author}
              </Text>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-2 mb-4">
                <Image source={require('@/assets/icons/calendar.png')} className="w-5 h-5" />
                <Text className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} `}>
                  {article.published_date}
                </Text>
              </View>
              <View className="flex-row items-center gap-2 mb-4">
                <Image source={require('@/assets/icons/clock.png')} className="w-5 h-5" />
                <Text className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} `}>
                  {formatRelativeTime(article.created_at)}
                </Text>
              </View>
            </View>

            {/* Image + Tag */}
            <View className="relative mb-6">
              <Image source={{ uri: article.image_url }} className="w-full h-48 rounded-md" />

              <View className="absolute top-3 left-3">
                <LinearGradient
                  colors={['#2CCB91', '#23A76F']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 10 }}
                  className="px-4 py-1"
                >
                  <Text className="text-white text-sm font-bold">{article.category?.name}</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Excerpt */}
            <Text
              className={`text-base ${isDark ? 'text-[#8AA897]' : 'text-gray-700'}  leading-relaxed mb-4`}
            >
              {article.excerpt}
            </Text>

            {/* 🔥 Render Full HTML Body */}
            <View className="mb-10">
              <RenderHTML
                contentWidth={width}
                source={{ html: article.body }}
                tagsStyles={{
                  p: {
                    marginBottom: 10,
                    fontSize: 16,
                    color: `#fffff`,
                    lineHeight: 22,
                  },
                  h2: {
                    fontSize: 20,
                    fontWeight: '700',
                    marginTop: 16,
                    marginBottom: 8,
                    color: '#fffff',
                  },
                }}
              />
            </View>
          </ScrollView>
        </View>
      </GradientBackground>
    </SafeAreaView>
  );
};

export default Details;
