import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoreHomeScreen from '@/screens/main/store/StoreHomeScreen';
// import ProductDetailScreen from '@/screens/main/store/ProductDetailScreen';
// import CartScreen from '@/screens/main/store/CartScreen';
import { StoreStackParamList } from '@/common/types';

const Stack = createNativeStackNavigator<StoreStackParamList>();

const StoreStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false, // ← This hides the header
    }}
  >
    <Stack.Screen name="StoreHome" component={StoreHomeScreen} options={{ title: 'Store' }} />
    {/* <Stack.Screen 
      name="ProductDetail" 
      component={ProductDetailScreen}
      options={{ title: 'Product Details' }}
    />
    <Stack.Screen 
      name="Cart" 
      component={CartScreen}
      options={{ title: 'Shopping Cart' }}
    /> */}
  </Stack.Navigator>
);

export default StoreStack;
