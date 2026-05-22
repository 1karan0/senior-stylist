import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AppStackParamList } from "@/common/types";
import Home from "@/screens/Home/Home";
import Tasks from "@/screens/Tasks/Tasks";
import Profile from "@/screens/Profile/Profile";
import Scanner from "@/screens/Scanner/Scanner";
import { Platform } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<AppStackParamList>();

export default function TabNavigation() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const baseBottom = Platform.OS === 'ios' ? 4 : 3;
  const bottomOffset = baseBottom + Math.max(0, insets.bottom - 6);
  const horizontalPadding = 20;
  return <Tab.Navigator
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
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen
      name="Scanner"
      component={Scanner}
      options={{ tabBarLabel: 'Scan' }}
    />
    <Tab.Screen name="Tasks" component={Tasks} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>;
}