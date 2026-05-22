import GradientBackground from "@/common/components/GradientBackground";
import { View, Text } from "react-native";

const Home = () => {
  return (
    <GradientBackground>
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-white">Home</Text>
      </View>
    </GradientBackground>
  )
}

export default Home;