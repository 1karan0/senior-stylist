import GradientBackground from "@/common/components/GradientBackground";
import { View, Text } from "react-native";
const Profile = () => {
  return (
    <GradientBackground>
    <View className="flex-1 items-center justify-center p-4">
      <Text className="text-2xl font-bold text-white">Profile</Text>
    </View>
    </GradientBackground>
  )
}

export default Profile;