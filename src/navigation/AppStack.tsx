import AuthGate from "./AuthGate";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList } from "@/common/types";
import Home from "@/screens/Home/Home";
import Profile from "@/screens/Profile/Profile";
import Tasks from "@/screens/Tasks/Tasks";
import TabNavigation from "./Tabnavigation";

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="UserTabs" component={TabNavigation} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name = "Tasks" component={Tasks} />
      <Stack.Screen name="Profile" component={Profile} />

    </Stack.Navigator>
  );
};

export default AppStack;