import React from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '@/screens/consulant/dashboard/Dashboard';
import RequestScreen from '@/screens/consulant/requests/Request';
import ChatScreen from '@/screens/consulant/chat/Home';
import ConsultantProfileScreen from '@/screens/consulant/profile/Profile';
import { ConsultantTabParamList } from '@/common/types';

const Tab = createBottomTabNavigator<ConsultantTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const iconMap: Record<string, { focused: IoniconsName; outline: IoniconsName }> = {
  DashboardTab: { focused: 'grid', outline: 'grid-outline' },
  RequestTab: { focused: 'download', outline: 'download-outline' },
  ChatTab: { focused: 'chatbubble', outline: 'chatbubble-outline' },
  ProfileTab: { focused: 'person-circle', outline: 'person-circle-outline' },
};

const TabBarIcon = ({
  routeName,
  focused,
  color,
}: {
  routeName: string;
  focused: boolean;
  color: string;
}) => {
  const cfg = iconMap[routeName] ?? { focused: 'help-circle', outline: 'help-circle-outline' };
  const name = focused ? cfg.focused : cfg.outline;
  return <Ionicons name={name} size={18} color={color} />;
};

const createTabBarIcon =
  (routeName: string) =>
  ({ focused, color }: { focused: boolean; color: string }) => (
    <TabBarIcon routeName={routeName} focused={focused} color={color} />
  );

const ConsultantTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  const baseBottom = Platform.OS === 'ios' ? 20 : 16;
  const bottomOffset = baseBottom + Math.max(0, insets.bottom - 6);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#27B07D',
        tabBarInactiveTintColor: '#658176',

        tabBarStyle: {
          position: 'absolute',
          bottom: bottomOffset,
          marginHorizontal: 10,
          height: 64,
          borderRadius: 36,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: '#DAE7E0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },

        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },

        // 🔥 Updated based on your request
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Poppins-Medium',
          marginTop: 2,
          marginBottom: 2,
          lineHeight: 18,
        },

        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={20} // ← larger icon
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="RequestTab"
        component={RequestScreen}
        options={{
          title: 'Requests',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'download' : 'download-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ConsultantProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={20}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default ConsultantTabNavigator;
