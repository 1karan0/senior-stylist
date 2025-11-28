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
import { useTheme } from '@/contexts/ThemeContext';

const Tab = createBottomTabNavigator<ConsultantTabParamList>();

const ConsultantTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  // lower base bottom to bring bar closer to the bottom
  const baseBottom = Platform.OS === 'ios' ? 4 : 2;
  const bottomOffset = baseBottom + Math.max(0, insets.bottom - 6);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#27B07D',
        tabBarInactiveTintColor: '#658176',

        tabBarStyle: {
          position: 'absolute',
          bottom: bottomOffset,
          marginHorizontal: 10, // symmetric left & right padding
          height: 62, // slightly smaller height
          borderRadius: 40,
          backgroundColor: isDark ? '#0E1B16' : 'rgba(255,255,255,0.95)',
          borderWidth: 1,
          borderColor: isDark ? '#273F36' : '#DAE7E0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 6,
          // don't set alignItems/justifyContent on the container; items handle layout
        },

        // Make each tab take equal width so spacing between tabs is consistent
        tabBarItemStyle: {
          flex: 1,
          marginHorizontal: 6, // space between tabs
          paddingTop: 6,
          paddingBottom: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Poppins-Medium',
          marginTop: 1,
          marginBottom: 3,
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
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={20} color={color} />
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
              size={21}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default ConsultantTabNavigator;
