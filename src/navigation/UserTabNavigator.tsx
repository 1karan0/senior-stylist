import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import ConsultationStack from '@/navigation/stacks/Consultation';
import NewsStack from '@/navigation/stacks/News';
import StoreStack from '@/navigation/stacks/Store';
import ProfileStack from '@/navigation/stacks/Profile';
import { MainTabParamList } from '@/common/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Define the valid icon names type
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// Move the icon component outside of render
const TabBarIcon = ({
  routeName,
  focused,
  color,
}: {
  routeName: string;
  focused: boolean;
  color: string;
}) => {
  const iconMap: Record<string, { focused: IoniconsName; outline: IoniconsName }> = {
    ConsultationTab: { focused: 'chatbubbles', outline: 'chatbubbles-outline' },
    NewsTab: { focused: 'newspaper', outline: 'newspaper-outline' },
    StoreTab: { focused: 'cart', outline: 'cart-outline' },
    ProfileTab: { focused: 'person', outline: 'person-outline' },
  };

  const config = iconMap[routeName] || { focused: 'help-circle', outline: 'help-circle-outline' };
  const iconName = focused ? config.focused : config.outline;

  return <Ionicons name={iconName} size={24} color={color} />;
};

// Create a function that returns the tabBarIcon configuration
const createTabBarIcon = (routeName: string) => {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <TabBarIcon routeName={routeName} focused={focused} color={color} />
  );
};

const UserTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
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
      }}
    >
      <Tab.Screen
        name="ConsultationTab"
        component={ConsultationStack}
        options={{
          title: 'Consultation',
          tabBarIcon: createTabBarIcon('ConsultationTab'),
        }}
      />
      <Tab.Screen
        name="NewsTab"
        component={NewsStack}
        options={{
          title: 'News',
          tabBarIcon: createTabBarIcon('NewsTab'),
        }}
      />
      <Tab.Screen
        name="StoreTab"
        component={StoreStack}
        options={{
          title: 'Store',
          tabBarIcon: createTabBarIcon('StoreTab'),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: createTabBarIcon('ProfileTab'),
        }}
      />
    </Tab.Navigator>
  );
};

export default UserTabNavigator;
