import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';

import { useGetStoreProducts } from '@/api/user/store/useGetStoreProducts';
import { useGetStoreCategories } from '@/api/user/store/useGetStoreCategories';

import ItemCard from './components/Itemcard';

const StoreScreen = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();

  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { mutateAsync: getProducts } = useGetStoreProducts();
  const { data: categories = [] } = useGetStoreCategories();

  const loadProducts = async (reset = false) => {
    reset && setRefreshing(true);

    const nextPage = reset ? 1 : page + 1;

    const res = await getProducts({
      page: nextPage,
      search,
      category,
    });

    setProducts((prev) => (reset ? res.items : [...prev, ...res.items]));
    setPage(nextPage);

    setRefreshing(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(true), 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <GradientBackground>
      <View className="flex-1 px-5 pt-6 pb-5">
        {/* Header */}
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
          Products
        </Text>

        {/* Search */}
        <View
          className={`flex-row items-center mt-4 rounded-xl border ${
            isDark
              ? 'bg-commonGradientStop6 border-commonGradientStop7'
              : 'bg-[#FAFAFA] border-[#E6E6E6]'
          }`}
          style={{ paddingHorizontal: 12, minHeight: 44 }}
        >
          <Image
            source={require('../../../assets/icons/search-icon.png')}
            className="w-5 h-5 opacity-70"
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, brands…"
            placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
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
          {/* Promo Image (NOT a banner component) */}
          <TouchableOpacity activeOpacity={0.9} className="mb-5 rounded-2xl overflow-hidden">
            <Image
              source={require('../../../assets/images/store-promo.png')}
              className="w-full h-32"
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
        <View>
          <Text
            className={`text-2xl font-poppins-semibold mb-[13px] ${isDark ? 'text-white' : 'text-[#0F172A]'}`}
          >
            Popular Products
          </Text>
        </View>
        {/* Product Grid */}
        <FlashList
          data={products}
          numColumns={2}
          renderItem={({ item, index }) => {
            const isEven = index % 2 === 0;
            return (
              <View
                style={{
                  marginRight: isEven ? 4 : 0,
                  marginLeft: isEven ? 0 : 4,
                  marginBottom: 12,
                }}
              >
                <ItemCard item={item} />
              </View>
            );
          }}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }}
          onEndReached={() => loadProducts(false)}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadProducts(true)} />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator className="mt-4" color="#00C896" /> : null
          }
        />
      </View>
    </GradientBackground>
  );
};

export default StoreScreen;
