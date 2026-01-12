import React from 'react';
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
import RenderHTML from 'react-native-render-html';

import { useGetNewsDetail } from '@/api/user/news/useGetNewsDetail';
import GradientBackground from '@/common/components/GradientBackground';
import { NewsStackParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';

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
      <GradientBackground className="flex-1 justify-center">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      </GradientBackground>
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
    <GradientBackground style={{ flex: 1 }}>
      <View className="flex-1 px-5 pt-6">
        {/* Top Bar */}
        <View className="flex-row justify-between items-center mb-5 ">
          <TouchableOpacity onPress={() => navigation.goBack()} className="">
            <Image
              source={
                isDark
                  ? require('@/assets/icons/green-back.png')
                  : require('@/assets/icons/back.png')
              }
              resizeMode="contain"
              style={{
                width: 20,
                height: 20,
              }}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text
            className={`text-xl font-poppins-semibold  ${isDark ? 'text-white' : 'text-textDark'} mb-2 leading-snug`}
          >
            {article.title}
          </Text>

          {/* Info Row */}
          <View className="flex-row items-center gap-2 mb-1">
            <Image
              source={require('@/assets/icons/green-user.png')}
              resizeMode="contain"
              style={{
                width: 20,
                height: 20,
              }}
            />
            <Text className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} `}>
              {article.author}
            </Text>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-row items-center gap-2 mb-4">
              <Image
                source={require('@/assets/icons/calendar.png')}
                resizeMode="contain"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
              <Text className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} `}>
                {article.published_date}
              </Text>
            </View>
            <View className="flex-row items-center gap-2 mb-4">
              <Image
                source={require('@/assets/icons/clock.png')}
                resizeMode="contain"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
              <Text className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} `}>
                {formatRelativeTime(article.created_at)}
              </Text>
            </View>
          </View>

          {/* Image + Tag */}
          <View className="relative mb-6">
            <Image source={{ uri: article.image_url }} className="w-full h-48 rounded-md" />

            <View className="absolute top-3 left-3">
              <View
                style={{
                  borderRadius: 10,
                  backgroundColor: '#2CCB91',
                }}
                className="px-4 py-1"
              >
                <Text className="text-white text-sm font-bold">{article.category?.name}</Text>
              </View>
            </View>
          </View>

          {/* Excerpt */}
          <Text
            className={`text-base ${isDark ? 'text-textSecondary' : 'text-gray-700'}  leading-relaxed mb-4`}
          >
            {article.excerpt}
          </Text>

          {/* 🔥 Render Full HTML Body */}
          <View className="mb-10">
            <RenderHTML
              contentWidth={width}
              source={{ html: article.body }}
              baseStyle={{
                color: isDark ? '#8AA897' : '#162721',
                fontSize: 16,
                lineHeight: 22,
              }}
              tagsStyles={{
                h2: {
                  fontSize: 20,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#162721',
                  marginTop: 16,
                  marginBottom: 2,
                },
              }}
            />
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default Details;
