import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NewsHomeScreen from '@/screens/main/news/NewsHomeScreen';
// import NewsDetailScreen from '@/screens/main/news/NewsDetailScreen';
// import NewsCategoryScreen from '@/screens/main/news/NewsCategoryScreen';
import { NewsStackParamList } from '@/common/types';

const Stack = createNativeStackNavigator<NewsStackParamList>();

const NewsStack: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="NewsHome" 
      component={NewsHomeScreen}
      options={{ title: 'News' }}
    />
    {/* <Stack.Screen 
      name="NewsDetail" 
      component={NewsDetailScreen}
      options={{ title: 'News Details' }}
    />
    <Stack.Screen 
      name="NewsCategory" 
      component={NewsCategoryScreen}
      options={{ title: 'Category' }}
    /> */}
  </Stack.Navigator>
);

export default NewsStack;