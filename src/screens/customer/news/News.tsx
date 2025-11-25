import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useGetNewsArticles } from '@/api/user/news/useGetNewsArticles';
import { useGetNewsCategories } from '@/api/user/news/useGetNewsCategories';
import ArticleCard from './components/ArticleCard';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';

const NewsScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: articles, isLoading } = useGetNewsArticles();
  const { data: rawCategories = [] } = useGetNewsCategories();
  const categories = [{ id: 'all', name: 'All' }, ...rawCategories];

  const { isDark } = useTheme();
  const navigation = useNavigation<any>();

  const filtered =
    selectedCategory === 'All'
      ? (articles ?? [])
      : (articles ?? []).filter((a: any) => a.category?.name === selectedCategory);

  return (
    <GradientBackground>
      <View className="flex-1 px-5 pt-10 pb-20">
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
          News Feed
        </Text>

        <Text
          className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} mt-1 text-sm font-poppins w-[70%]`}
        >
          Stay updated with the latest news and announcements
        </Text>

        {/* Search */}
        <View className="flex flex-col gap-3">
          <View
            className={`flex-row items-center border ${
              isDark ? 'bg-[#0E1B16] border-[#273F36]' : 'bg-[#FAFAFA] border-[#E6E6E6]'
            } rounded-xl px-3 py-2 mt-3`}
          >
            <Image
              source={require('../../../assets/icons/search-icon.png')}
              className="w-5 h-5 mr-1"
            />
            <TextInput
              placeholder="Search conversations..."
              placeholderTextColor="#658176"
              className="text-base"
            />
          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {categories.map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1 rounded-xl mr-2 ${
                  selectedCategory === cat.name
                    ? 'bg-[#00C896]'
                    : `${isDark ? 'bg-[#0E1B16] border-[#273F36]' : 'bg-white border-gray-300'} border`
                }`}
              >
                <Text
                  className={`${
                    selectedCategory === cat.name ? 'text-white' : 'text-gray-700'
                  } ${isDark ? 'text-white' : 'text-gray-700'} font-bold text-sm`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Articles List using FlashList */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#00C896" className="mt-10" />
        ) : (
          <FlashList
            data={filtered}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 200 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('NewsDetail', { slug: item.slug })}
              >
                <ArticleCard item={item} />
              </TouchableOpacity>
            )}
            overrideItemLayout={(layout: any) => {
              layout.size = 250;
            }}
          />
        )}
      </View>
    </GradientBackground>
  );
};

export default NewsScreen;
