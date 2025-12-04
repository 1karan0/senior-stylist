import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useGetNewsArticles } from '@/api/user/news/useGetNewsArticles';
import { useGetNewsCategories } from '@/api/user/news/useGetNewsCategories';
import ArticleCard from './components/ArticleCard';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';

const NewsScreen = () => {
  const [page, setPage] = useState(1);
  const [list, setList] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const { mutateAsync: getArticles, isPending } = useGetNewsArticles();
  const { data: rawCategories = [] } = useGetNewsCategories();
  const categories = [{ id: 'all', name: 'All' }, ...rawCategories];

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

  const filtered = list
    .filter((a: any) => (selectedCategory === 'All' ? true : a.category?.name === selectedCategory))
    .filter((a: any) =>
      search.trim().length === 0
        ? true
        : a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
          a.category?.name?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <GradientBackground>
      <View className="flex-1 px-5 pt-6 pb-20">
        {/* Header */}
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
          News Feed
        </Text>

        {/* Search */}
        <View
          className={`flex-row items-center border mt-5 px-3 rounded-xl ${
            isDark
              ? 'bg-commonGradientStop6 border-commonGradientStop7'
              : 'bg-[#FAFAFA] border-[#E6E6E6]'
          }`}
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
          contentContainerStyle={{ paddingTop: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('NewsDetail', { slug: item.slug })}
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
      </View>
    </GradientBackground>
  );
};

export default NewsScreen;
