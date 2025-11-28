import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import ConsultationStack from '@/navigation/stacks/Consultation';
import NewsStack from '@/navigation/stacks/News';
import StoreStack from '@/navigation/stacks/Store';
import ProfileStack from '@/navigation/stacks/Profile';
import { MainTabParamList } from '@/common/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

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

  const baseBottom = 16;
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
          backgroundColor: isDark ? '#0E1B16' : 'rgba(255,255,255,0.95)',
          borderWidth: 1,
          borderColor: isDark ? '#273F36' : '#DAE7E0',
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

        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Poppins-Medium', // ← applies your custom font
          marginTop: 2,
          marginBottom: 2,
          lineHeight: 18,
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
