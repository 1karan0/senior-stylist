import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import ConsultationStack from '@/navigation/stacks/Consultation';
import NewsStack from '@/navigation/stacks/News';
import StoreStack from '@/navigation/stacks/Store';
import ProfileStack from '@/navigation/stacks/Profile';
import { MainTabParamList } from '@/common/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { FindingStylistModalProvider } from '@/contexts/FindingStylistModalContext';
import FindingStylistModal from '@/common/components/modals/FindingStylistModal';
import { useTabletLayout } from '@/hooks/useTabletLayout';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

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
    ProfileTab: { focused: 'person-circle', outline: 'person-circle-outline' },
  };

  const config = iconMap[routeName];
  const iconName = focused ? config.focused : config.outline;

  return <Ionicons name={iconName} size={20} color={color} />; // ← icon size adjusted
};

const createTabBarIcon = (routeName: string) => {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <TabBarIcon routeName={routeName} focused={focused} color={color} />
  );
};

const UserTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { isGuest } = useAuth();
  const { horizontalPadding } = useTabletLayout();
  // lower base bottom to bring bar closer to the bottom
  const baseBottom = Platform.OS === 'ios' ? 4 : 3;
  const bottomOffset = baseBottom + Math.max(0, insets.bottom - 6);

  return (
    <FindingStylistModalProvider>
      <>
        <Tab.Navigator
          initialRouteName={isGuest ? 'StoreTab' : 'ConsultationTab'}
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
              paddingTop: Platform.OS === 'ios' ? 6 : 6,
              paddingBottom: Platform.OS === 'ios' ? 8 : 6,
            },

            tabBarItemStyle: {
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: Platform.OS === 'ios' ? 4 : 10,
              paddingTop: Platform.OS === 'ios' ? 2 : 0,
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
            name="ConsultationTab"
            component={ConsultationStack}
            options={{
              title: 'Consultation',
              tabBarIcon: createTabBarIcon('ConsultationTab'),
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
            name="NewsTab"
            component={NewsStack}
            options={{
              title: 'News',
              tabBarIcon: createTabBarIcon('NewsTab'),
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

        {/* Full-screen overlay modal that covers tabs */}
        <FindingStylistModal />
      </>
    </FindingStylistModalProvider>
  );
};

export default UserTabNavigator;
