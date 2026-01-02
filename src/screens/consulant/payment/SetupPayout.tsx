import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import { ScrollView, StatusBar, Text, View, Image, TouchableOpacity } from 'react-native';
import Button from '@/common/components/Button';

type StepStatus = 'completed' | 'pending' | 'not_started';

interface SetupStep {
  number: number;
  title: string;
  description: string;
  status: StepStatus;
  badgeText: string;
  badgeBgColor: string;
  badgeTextColor: string;
}

const SetupPayout = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();

  const setupSteps: SetupStep[] = [
    {
      number: 1,
      title: 'Create Stripe Account',
      description: "We'll create a secure Stripe Express account for you.",
      status: 'completed',
      badgeText: 'Completed',
      badgeBgColor: '#D4EDDA',
      badgeTextColor: '#155724',
    },
    {
      number: 2,
      title: 'Complete Onboarding',
      description: "Enter your bank details, address, and tax information in Stripe's secure form.",
      status: 'pending',
      badgeText: 'Pending',
      badgeBgColor: '#FFF3CD',
      badgeTextColor: '#856404',
    },
    {
      number: 3,
      title: 'Verification',
      description: 'Stripe will verify your details (usually takes 1-3 days).',
      status: 'not_started',
      badgeText: 'Not Started',
      badgeBgColor: '#F8D7DA',
      badgeTextColor: '#721C24',
    },
  ];

  const handleContinueToStripe = () => {
    // Navigate to Stripe onboarding
  };

  const handleLearnMore = () => {
    // Navigate to learn more about payouts
  };

  return (
    <GradientBackground>
      <View className="flex-1">
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />
        <View className="px-5  pb-4 bg-buttonPrimaryBg rounded-b-[24px] h-[141px] relative z-0">
          {' '}
        </View>
        <ScrollView
          className="flex-1 px-5 absolute top-5 left-0 right-0 bottom-5 z-10 "
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }}
        >
          <View className="mb-5">
            <Text className={`text-3xl font-urbanist-bold mb-1 text-white`}>Setup Payouts</Text>
            <Text className={`text-sm font-urbanist-regular text-white opacity-80`}>
              Get paid for your consultations
            </Text>
          </View>

          {/* How it works card */}
          <View
            className={`rounded-2xl p-6 mb-4 ${
              isDark
                ? 'bg-[#233931] border border-[#445E54]'
                : 'bg-[#E2F2EA] border border-[#DAE7E0]'
            }`}
          >
            <Text
              className={`${isDark ? 'text-[#ffffff]' : 'text-[#162721]'} text-lg font-urbanist-bold mb-2`}
            >
              How it works
            </Text>
            <Text
              className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-sm font-poppins-regular`}
            >
              We use Stripe to securely collect your bank details and verify your identity. This is
              a one-time setup that takes about 5 minutes. Stripe handles all tax information
              collection automatically.
            </Text>
          </View>

          {/* Setup Steps */}
          <View className="mb-4">
            {setupSteps.map((step) => (
              <View
                key={step.number}
                className={`mb-4 rounded-xl p-5 border ${isDark ? 'border-[#445E54] bg-[#162721]' : 'border-[#DAE7E0] bg-[#FFFFFF]'}`}
              >
                <View className="flex-row items-start mb-2">
                  <View className="w-8 h-8 rounded-[10px] bg-[#36D399] items-center justify-center mr-3 mt-1">
                    <Text className="text-white text-base font-urbanist-bold">{step.number}</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`${isDark ? 'text-white' : 'text-black'} text-base font-poppins-semibold mb-1`}
                    >
                      {step.title}
                    </Text>
                    <Text
                      className={`${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-sm font-poppins-regular mb-2`}
                    >
                      {step.description}
                    </Text>
                    <View
                      className="px-3 py-1 rounded-[10px] self-start"
                      style={{ backgroundColor: step.badgeBgColor }}
                    >
                      <Text
                        className="text-xs font-urbanist-bold"
                        style={{ color: step.badgeTextColor }}
                      >
                        {step.badgeText}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View className="mb-4 gap-3">
            <Button
              text="Continue to Stripe Onboarding"
              onPress={handleContinueToStripe}
              variant="gradient"
              className="w-full rounded-[10px]"
            />
            <TouchableOpacity
              onPress={handleLearnMore}
              className="bg-[#162721] rounded-[10px] py-4 px-4 items-center justify-center"
            >
              <Text className="text-white text-base font-urbanist-bold">
                Learn More About Payouts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Important Alert */}
          <View className="bg-[#FFF3CD] rounded-xl p-4 mb-6 border border-[#DAE7E0]">
            <View className="flex-row items-center gap-3">
              <Image
                source={require('@/assets/icons/warn.png')}
                className="w-6 h-6"
                resizeMode="contain"
              />
              <View className="flex-1">
                <Text className="text-[#856404] text-xs font-urbanist-bold mb-1">Important</Text>
                <Text className="text-[#856404] text-xs font-urbanist-regular">
                  You'll be redirected to Stripe's secure website to complete your bank details.
                  This is safe and required for payouts.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default SetupPayout;
