import { View, Text } from "react-native";
import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AppNavigation from "@/navigation/AppNavigation";
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigation />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App;