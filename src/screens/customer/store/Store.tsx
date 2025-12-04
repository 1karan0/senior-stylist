import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';

import { useGetStoreProducts } from '@/api/user/store/useGetStoreProducts';
import { useGetStoreCategories } from '@/api/user/store/useGetStoreCategories';
import Itemcard from './components/Itemcard';

const StoreScreen = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { isDark } = useTheme();

  const { mutateAsync: getProducts, isPending } = useGetStoreProducts();
  const { data: categories = [] } = useGetStoreCategories();

  const loadProducts = async (reset = false) => {
    if (reset) setRefreshing(true);
    else setLoadingMore(true);

    const next = reset ? 1 : page + 1;

    const res = await getProducts({
      page: next,
      search,
      category,
    });

    setProducts((prev) => (reset ? res.items : [...prev, ...res.items]));
    if (!reset) setPage(next);

    setRefreshing(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadProducts(true), 300);
    return () => clearTimeout(timeout);
  }, [search, category]);

  const renderProduct = ({ item }: any) => <Itemcard item={item} />;

  return (
    <GradientBackground>
      <View className="flex-1 px-5 pt-6 pb-20">
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
          Partner Store
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
            placeholder="Search Products..."
            placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
            value={search}
            onChangeText={setSearch}
            className={`ml-2 flex-1 ${isDark ? 'text-white' : 'text-black'}`}
          />
        </View>

        <View>
          {/* Category Horizontal FlatList */}
          <FlatList
            data={[{ id: 'all', name: 'All', slug: null }, ...categories]}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
            renderItem={({ item }) => {
              const active = category === item.slug || (item.slug === null && category === null);

              return (
                <TouchableOpacity
                  onPress={() => setCategory(item.slug)}
                  className={`px-3 py-1 rounded-xl mr-2 ${
                    active
                      ? 'bg-[#00C896]'
                      : `${isDark ? 'bg-commonGradientStop6 border-commonGradientStop7' : 'bg-white border-gray-300'} border`
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active ? 'text-white' : isDark ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Product FlashList */}
        <FlashList
          data={products}
          renderItem={renderProduct}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20 }}
          onEndReached={() => loadProducts(false)}
          onEndReachedThreshold={0.2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadProducts(true)} />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color="#00C896" className="mt-4" /> : null
          }
        />
      </View>
    </GradientBackground>
  );
};

export default StoreScreen;
