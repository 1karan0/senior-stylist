import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import ConsultationStack from '@/navigation/stacks/Consultation';
import NewsStack from '@/navigation/stacks/News';
import StoreStack from '@/navigation/stacks/Store';
import ProfileStack from '@/navigation/stacks/Profile';
import { MainTabParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#27B07D',
        tabBarInactiveTintColor: '#658176',
        tabBarStyle: {
          position: 'absolute',
          bottom: 10,
          left: 24,
          right: 24,
          height: 65,
          borderRadius: 40,
          backgroundColor: `${isDark ? '#0E1B16' : 'rgba(255, 255, 255, 0.95)'}`,
          borderWidth: 1,
          borderColor: `${isDark ? '#0E1B16' : '#DAE7E0'}`,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          paddingHorizontal: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '500',
          marginBottom: 5,
        },
        headerShown: false, // This hides the header for all screens
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
