import Login from "@/screens/Auth/Login";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "@/common/types";
import Signup from "@/screens/Auth/Signup";

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
    </Stack.Navigator>
  );
};

export default AuthStack;