import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import DashboardScreen from '@/screens/consulant/dashboard/Dashboard';
import RequestScreen from '@/screens/consulant/requests/Request';
import ChatScreen from '@/screens/consulant/chat/Home';
import ConsultantProfileScreen from '@/screens/consulant/profile/Profile';
import { ConsultantTabParamList } from '@/common/types';

const Tab = createBottomTabNavigator<ConsultantTabParamList>();

// Define the valid icon names type
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// Move the icon component outside of render to fix unstable nested components warning
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
    DashboardTab: { focused: 'speedometer', outline: 'speedometer-outline' },
    RequestTab: { focused: 'document-text', outline: 'document-text-outline' },
    ChatTab: { focused: 'chatbubbles', outline: 'chatbubbles-outline' },
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

const ConsultantTabNavigator: React.FC = () => {
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: '#DAE7E0',
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
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: createTabBarIcon('DashboardTab'),
        }}
      />
      <Tab.Screen
        name="RequestTab"
        component={RequestScreen}
        options={{
          title: 'Requests',
          tabBarIcon: createTabBarIcon('RequestTab'),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          title: 'Chat',
          tabBarIcon: createTabBarIcon('ChatTab'),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ConsultantProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: createTabBarIcon('ProfileTab'),
        }}
      />
    </Tab.Navigator>
  );
};

export default ConsultantTabNavigator;
