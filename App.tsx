import { View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import "./global.css";
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <View className='flex-1'>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
}