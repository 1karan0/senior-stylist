import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NewsStackParamList } from '@/common/types';
import Details from '@/screens/customer/news/Details';
import News from '@/screens/customer/news/News';

const Stack = createNativeStackNavigator<NewsStackParamList>();

const NewsStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false, // ← This hides the header
    }}
  >
    <Stack.Screen name="NewsHome" component={News} options={{ title: 'News' }} />
    <Stack.Screen name="NewsDetail" component={Details} options={{ title: 'News Details' }} />
  </Stack.Navigator>
);

export default NewsStack;
