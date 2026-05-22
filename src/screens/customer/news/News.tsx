import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { useGetNewsArticles } from '@/api/user/news/useGetNewsArticles';
import { useGetNewsCategories } from '@/api/user/news/useGetNewsCategories';
import { useGetQuestionnaireStatus } from '@/api/user/questionnaire/useGetQuestionnaire';

import ArticleCard from './components/ArticleCard';
import NewsWebViewModal from './components/NewsWebViewModal';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import ActiveStylist from '@/common/components/ActiveStylists';
import { useAuth } from '@/contexts/AuthContext';
import CompleteQuestions from '@/common/components/CompleteQuestions';
import { useTabletLayout } from '@/hooks/useTabletLayout';

const NewsScreen = () => {
  const [page, setPage] = useState(1);
  const [list, setList] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [webViewModal, setWebViewModal] = useState<{
    visible: boolean;
    url: string;
    title: string;
  }>({
    visible: false,
    url: '',
    title: '',
  });
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const { horizontalPadding } = useTabletLayout();
  const { mutateAsync: getArticles, isPending } = useGetNewsArticles();
  const { data: rawCategories = [] } = useGetNewsCategories();
  const categories = [{ id: 'all', name: 'All' }, ...rawCategories];
  const { user } = useAuth();
  const { data: questionnaireStatus } = useGetQuestionnaireStatus({
    enabled: !!user,
  });
  const shouldShowCompleteQuestions =
    (questionnaireStatus?.missingRequiredQuestionIds?.length ?? 0) > 0 ||
    (questionnaireStatus?.unansweredQuestionIds?.length ?? 0) > 0 ||
    questionnaireStatus?.setupComplete === false ||
    (questionnaireStatus == null && user?.has_new_questionnaire_questions === true);
  const loadPage = async (reset = false) => {
    const next = reset ? 1 : page + 1;

    const res = await getArticles(next);

    setList((prev) => (reset ? res.items : [...prev, ...res.items]));
    setPage(res.pagination.current_page);
    setHasMore(res.pagination.has_more);
  };

  useEffect(() => {
    loadPage(true);
  }, []);

  const searchLower = (search ?? '').trim().toLowerCase();
  const filtered = list
    .filter((a: any) => (selectedCategory === 'All' ? true : a.category?.name === selectedCategory))
    .filter((a: any) =>
      searchLower.length === 0
        ? true
        : (a.title ?? '').toLowerCase().includes(searchLower) ||
          (a.excerpt ?? '').toLowerCase().includes(searchLower) ||
          (a.category?.name ?? '').toLowerCase().includes(searchLower)
    );

  return (
    <GradientBackground>
      <View className="flex-1 pt-6 mb-5" style={{ paddingHorizontal: horizontalPadding }}>
        {/* Header */}
        {shouldShowCompleteQuestions && <CompleteQuestions />}
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
          News Feed
        </Text>

        <View className="mt-2">
          <ActiveStylist />
        </View>
        {/* Search */}
        <View
          className={`flex-row items-center border mt-4 rounded-xl ${
            isDark
              ? 'bg-commonGradientStop6 border-commonGradientStop7'
              : 'bg-[#FAFAFA] border-[#E6E6E6]'
          }`}
          style={{
            paddingHorizontal: 12,
            minHeight: Platform.OS === 'ios' ? 32 : 48,
            paddingVertical: Platform.OS === 'ios' ? 8 : 0,
          }}
        >
          <Image
            source={require('../../../assets/icons/search-icon.png')}
            className="w-5 h-5 opacity-70"
          />
          <TextInput
            placeholder="Search news..."
            placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
            value={search}
            onChangeText={setSearch}
            className={`ml-2 flex-1 ${isDark ? 'text-white' : 'text-black'}`}
            style={{
              paddingVertical: Platform.OS === 'ios' ? 8 : 0,
              fontSize: 15,
              includeFontPadding: false,
            }}
          />
        </View>

        {/* Categories */}
        <FlashList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item.name)}
              className={`px-3 py-1 rounded-xl mr-2 ${
                selectedCategory === item.name
                  ? 'bg-[#00C896]'
                  : `${isDark ? 'bg-commonGradientStop6 border-commonGradientStop7' : 'bg-white border-gray-300'} border`
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedCategory === item.name
                    ? 'text-white'
                    : isDark
                      ? 'text-white'
                      : 'text-gray-700'
                }`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Articles List */}
        <FlashList
          data={filtered}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingVertical: 4, paddingBottom }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                // Check if article should open in web view modal
                if (item.open_in_webview && item.external_url) {
                  setWebViewModal({
                    visible: true,
                    url: item.external_url,
                    title: item.title,
                  });
                } else {
                  // Navigate to detail screen for regular articles
                  navigation.navigate('NewsDetail', { slug: item.slug });
                }
              }}
            >
              <ArticleCard item={item} />
            </TouchableOpacity>
          )}
          onEndReached={() => hasMore && !isPending && loadPage(false)}
          onEndReachedThreshold={0.2}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => loadPage(true)} />}
          ListFooterComponent={
            isPending ? <ActivityIndicator size="small" color="#00C896" className="my-4" /> : null
          }
        />

        {/* WebView Modal */}
        <NewsWebViewModal
          visible={webViewModal.visible}
          url={webViewModal.url}
          title={webViewModal.title}
          onClose={() => setWebViewModal({ visible: false, url: '', title: '' })}
        />
      </View>
    </GradientBackground>
  );
};

export default NewsScreen;
