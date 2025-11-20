import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import ConsultationStack from '@/navigation/stacks/Consultation';
import NewsStack from '@/navigation/stacks/News';
import StoreStack from '@/navigation/stacks/Store';
import ProfileStack from '@/navigation/stacks/Profile';
import { MainTabParamList } from '@/common/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'ConsultationTab') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'NewsTab') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'StoreTab') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          // Type assertion to tell TypeScript we know these are valid
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingVertical: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="ConsultationTab"
        component={ConsultationStack}
        options={{ title: 'Consultation' }}
      />
      <Tab.Screen name="NewsTab" component={NewsStack} options={{ title: 'News' }} />
      <Tab.Screen name="StoreTab" component={StoreStack} options={{ title: 'Store' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
