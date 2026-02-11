import React from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '@/screens/consulant/dashboard/Dashboard';
import RequestScreen from '@/screens/consulant/requests/Request';
import ChatScreen from '@/screens/consulant/chat/Home';
import ConsultantProfileScreen from '@/screens/consulant/profile/Profile';
import EditProfileScreen from '@/screens/consulant/profile/EditProfile';
import SettingsScreen from '@/screens/consulant/profile/Settings';
import { ConsultantTabParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import MyEarning from '@/screens/consulant/payment/MyEarning';
import WithdrawFunds from '@/screens/consulant/payment/WithdrawFunds';
import EarningStatement from '@/screens/consulant/payment/EarningStatement';
import PayOutHistory from '@/screens/consulant/payment/PayOutHistory';
import RecentEarning from '@/screens/consulant/payment/RecentEarning';
import Disputes from '@/screens/consulant/profile/Disputes';
import { useTabletLayout } from '@/hooks/useTabletLayout';

const Tab = createBottomTabNavigator<ConsultantTabParamList>();
const ProfileStack = createNativeStackNavigator();

const ProfileStackNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={{
        headerShown: false, // hide native header for profile stack
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ConsultantProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="MyEarning" component={MyEarning} />
      <ProfileStack.Screen name="WithdrawFunds" component={WithdrawFunds} />
      <ProfileStack.Screen name="EarningStatement" component={EarningStatement} />
      <ProfileStack.Screen name="PayOutHistory" component={PayOutHistory} />
      <ProfileStack.Screen name="RecentEarning" component={RecentEarning} />
      <ProfileStack.Screen name="Disputes" component={Disputes} />
    </ProfileStack.Navigator>
  );
};

const ConsultantTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { horizontalPadding } = useTabletLayout();
  // lower base bottom to bring bar closer to the bottom
  const baseBottom = Platform.OS === 'ios' ? 4 : 3;
  const bottomOffset = baseBottom + Math.max(0, insets.bottom - 6);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#27B07D',
        tabBarInactiveTintColor: '#658176',
        tabBarShowLabel: true,

        tabBarStyle: {
          position: 'absolute',
          bottom: bottomOffset,
          marginHorizontal: horizontalPadding / 2,
          height: Platform.OS === 'ios' ? 70 : 62,
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
          paddingTop: Platform.OS === 'ios' ? 6 : 0,
          paddingBottom: Platform.OS === 'ios' ? 8 : 6,
        },

        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: Platform.OS === 'ios' ? 4 : 0,
          paddingTop: Platform.OS === 'ios' ? 2 : 6,
          paddingBottom: Platform.OS === 'ios' ? 4 : 6,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Poppins-Medium',
          marginTop: Platform.OS === 'ios' ? 4 : 1,
          marginBottom: Platform.OS === 'ios' ? 0 : 3,
          lineHeight: Platform.OS === 'ios' ? 16 : 18,
          includeFontPadding: false,
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
        component={ProfileStackNavigator}
        options={{
          title: 'Profile',
          // profile tab will be active whenever any screen in ProfileStack is focused
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
