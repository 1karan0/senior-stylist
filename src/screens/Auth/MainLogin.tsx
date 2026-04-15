import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Image, KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabletLayout } from '@/hooks/useTabletLayout';

const MainLogin = () => {
  const navigation = useNavigation<any>();
  const { login, continueAsGuest } = useAuth();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { screenContentStyle, horizontalPadding } = useTabletLayout();

  const handleContinueAsGuest = () => {
    continueAsGuest();
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
            flexGrow: 1,
          }}
          style={[{ paddingHorizontal: horizontalPadding }]}
        >
          {/* Logo & Header */}
          <View className="items-center mt-16 mb-12">
            <Image
              source={
                isDark
                  ? require('../../assets/icons/dark-logo.png')
                  : require('../../assets/icons/colored_logo.png')
              }
              className="w-[100px] h-[100px]"
              resizeMode="contain"
            />

            <Text
              className={`font-bold text-[24px] ${isDark ? 'text-white' : 'text-textDark'} mt-4`}
            >
              Elevate Your Style
            </Text>

            <Text
              className={`font-normal text-[14px] ${
                isDark ? 'text-textSecondary' : 'text-textMuted'
              }  mt-1`}
            >
              Sign in to access your personalized StyleHub
            </Text>
          </View>

          {/* Login Group */}
          <View className="gap-y-4">
            <Button text="Login with Phone" onPress={() => navigation.navigate('PhoneOtp')} />
            <Button
              text="Login with Email"
              variant="light"
              onPress={() => navigation.navigate('LoginWithMail')}
              className="rounded-[14px]"
            />
          </View>

          {/* Single Divider */}
          <View className="flex-row items-center my-8">
            <View className={`flex-1 h-[0.5px] ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
            <Text
              className={` text-xs font-medium uppercase tracking-widest ${
                isDark ? 'text-textSecondary' : 'text-textMuted'
              }`}
            >
              New to StyleHub?
            </Text>
            <View className={`flex-1 h-[0.5px] ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
          </View>

          {/* Sign Up Section */}
          <View className="mb-8">
            <Button
              text="Create an Account"
              onPress={() => navigation.navigate('Signup', { user: 'customer' })}
              className={`rounded-[14px] ${isDark ? 'bg-[#0E1B17] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DAE7E0]'} border`}
              textClassName={`${isDark ? 'text-white' : 'text-[#162721]'} text-base font-semibold`}
            />
          </View>

          {/* Footer Actions */}
          <View className="items-center gap-y-4">
            <Pressable onPress={handleContinueAsGuest}>
              <Text className="text-textPrimary font-semibold text-[15px]">Continue as Guest</Text>
            </Pressable>

            <View className="flex-row items-center">
              <Text className={`${isDark ? 'text-textSecondary' : 'text-textMuted'} text-[14px]`}>
                Want to be a Consultant?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Signup', { user: 'consultant' })}>
                <Text className="text-textPrimary font-bold text-[14px]">Register here</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

export default MainLogin;
