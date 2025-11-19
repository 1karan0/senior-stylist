import React from 'react';
import { View, Text } from 'react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';

function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Hello World - Navigation Disabled</Text>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <HomeScreen />
    </ThemeProvider>
  );
}
