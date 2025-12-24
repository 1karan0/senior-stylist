import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useGetSubscriptionPlans,
  SubscriptionPlan,
} from '@/api/subscription/useGetSubscriptionPlans';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import { AppStackParamList } from '@/common/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/constants/Theme';
import GradientBackground from '@/common/components/GradientBackground';
import Button from '@/common/components/Button';

interface PlanDisplay {
  key: string;
  title: string;
  price: string;
  priceSub: string; // Kept for SubscriptionModal compatibility
  priceWithConsultations: string;
  desc: string;
  features: string[];
  consulationPerMonth: number;
  originalPlan: SubscriptionPlan;
}

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'Pricing'>;

export default function PricingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { data: subscriptionPlans, isLoading, error } = useGetSubscriptionPlans();
  const [selectedPlan, setSelectedPlan] = useState<PlanDisplay | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState(false);
  const { isDark } = useTheme();

  const backgroundGradient: (string | number)[] = isDark
    ? [...ThemeColors.gradients.dark.background]
    : [...ThemeColors.gradients.light.background];

  // Transform API data to display format and filter out test plans
  const plans = useMemo(() => {
    if (!subscriptionPlans) {
      console.log('[Pricing] No subscription plans data available');
      return [];
    }

    const filteredPlans = subscriptionPlans.filter((plan) => !plan.slug.includes('-test'));
    const sortedPlans = filteredPlans.sort((a, b) => a.sort_order - b.sort_order);

    const mappedPlans = sortedPlans.map((plan) => {
      // Helper function to remove decimals from price
      const formatPriceWithoutDecimals = (priceString: string): string => {
        const priceMatch = priceString.match(/£?([\d,]+\.?\d*)/);
        if (priceMatch) {
          const numericValue = parseFloat(priceMatch[1].replace(/,/g, ''));
          const currencySymbol = priceString.includes('£') ? '£' : '';
          const priceValue =
            numericValue % 1 === 0 ? Math.floor(numericValue).toString() : numericValue.toString();
          return `${currencySymbol}${priceValue}`;
        }
        return priceString;
      };

      // Extract numeric value from discounted_price_formatted and remove decimals
      // e.g., "£6.00" -> "£6" or "£12.00" -> "£12"
      const formattedPrice = formatPriceWithoutDecimals(plan.discounted_price_formatted);
      const formattedMonthlyPrice = formatPriceWithoutDecimals(plan.monthly_price_formatted);

      // Format: "£6/Monthly - 4 consultations"
      const priceWithConsultations = `${formattedPrice}/Monthly - ${plan.consultations_per_month} consultations`;

      const planDisplay = {
        key: plan.slug,
        title: plan.name,
        price: formattedPrice, // Just the price number without decimals
        priceSub: `${plan.monthly_price_formatted}/month`, // Kept for SubscriptionModal compatibility
        priceWithConsultations, // Full price line with consultations
        desc: `Then ${formattedMonthlyPrice}/month after ${plan.discount_duration_months} months`,
        features: [
          `${plan.consultations_per_month} consultations/month`,
          'Message-based consultations',
          'Product recommendations',
          'Expert matching system',
        ],
        consulationPerMonth: plan.consultations_per_month,
        originalPlan: plan,
      };

      return planDisplay;
    });

    return mappedPlans;
  }, [subscriptionPlans]);

  // Fetch current subscription status
  useEffect(() => {
    const fetchCurrentSubscription = async () => {
      try {
        setIsLoadingSubscription(true);
        const subscription = await getCurrentSubscription();
        setCurrentSubscription(subscription);
        if (subscription) {
          console.log('[Pricing] Current subscription found', {
            subscriptionId: subscription.id,
            planId: subscription.plan_id,
            status: subscription.status,
          });
        }
      } catch (error: any) {
        console.error('[Pricing] Failed to fetch current subscription:', error.message);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    fetchCurrentSubscription();
  }, []);

  // Set default selected plan when plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      // If user has active subscription, pre-select that plan
      if (currentSubscription?.status === 'active' && currentSubscription.plan_id) {
        const currentPlan = plans.find((p) => p.originalPlan.id === currentSubscription.plan_id);
        if (currentPlan) {
          setSelectedPlan(currentPlan);
          return;
        }
      }
      // Default to the middle plan or first plan
      const defaultPlan = plans[Math.floor(plans.length / 2)] || plans[0];
      setSelectedPlan(defaultPlan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, currentSubscription]);

  return (
    <GradientBackground>
      <View className="px-5 py-6">
        {/* HEADER */}
        <View className="pt-6 items-center">
          <Text
            className={`text-[24px] font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
          >
            Choose Your Plan
          </Text>
          <Text
            className={`text-center font-poppins-regular mt-2 ${isDark ? 'text-textMuted' : 'text-textDark'}`}
          >
            Select a subscription to get started with expert{'\n'}consultations
          </Text>
        </View>

        {/* OFFER BADGE */}
        <View className="mt-6 items-center">
          <View className="rounded-xl py-2 px-4 w-60 bg-commonGradientStop10">
            <Text
              className={`text-center text-base font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              50% OFF - First 6 Months
            </Text>
          </View>
          <Text
            className={`text-sm font-poppins-regular mt-2 ${isDark ? 'text-textMuted' : 'text-textDark'}`}
          >
            Minimum 1 year subscription
          </Text>
        </View>

        {/* PLANS */}
        <View className="mt-8 flex flex-col gap-4">
          {isLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#23A76F" />
              <Text className="mt-4" style={{ color: isDark ? '#9CA3AF' : '#64748B' }}>
                Loading plans...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-8">
              <Text className="text-red-500 text-center">
                Failed to load subscription plans. Please try again.
              </Text>
            </View>
          ) : plans.length === 0 ? (
            <View className="items-center justify-center py-8">
              <Text className="text-center" style={{ color: isDark ? '#9CA3AF' : '#64748B' }}>
                No subscription plans available.
              </Text>
            </View>
          ) : (
            plans.map((item) => {
              const active = selectedPlan?.key === item.key;
              const isCurrentPlan =
                currentSubscription?.status === 'active' &&
                currentSubscription.plan_id === item.originalPlan.id;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setSelectedPlan(item)}
                  className={`rounded-md border px-4 py-4 ${active && 'border-commonGradientStop2'} ${isDark ? 'bg-bgDark1 border-[#273F36]' : 'bg-bgLight0 border-[#DAE7E0]'}`}
                >
                  <View className="flex-row items-center gap-3">
                    {/* Radio Button */}
                    <View
                      className={`w-5 h-5 rounded-full border ${
                        active ? 'border-commonGradientStop1' : 'border-[#273F36]'
                      } items-center justify-center`}
                    >
                      {active && <View className="w-3 h-3 rounded-full bg-[#23A76F]" />}
                    </View>

                    <View className="flex-1">
                      <Text
                        className="font-poppins-medium text-[18px]"
                        style={{ color: isDark ? '#ffffff' : '#162721' }}
                      >
                        {item.title}
                      </Text>

                      {/* Price with consultations: "£6/Monthly - 4 consultations" */}
                      <View className="flex-row items-center justify-between mt-1">
                        <View className="flex-row items-center flex-1">
                          <Text
                            className="font-poppins-semibold text-[22px]"
                            style={{ color: isDark ? '#ffffff' : '#162721' }}
                          >
                            {item?.price}
                          </Text>
                          <Text
                            className="font-poppins-regular text-[16px]"
                            style={{ color: isDark ? '#8AA897' : '#658176' }}
                          >
                            /
                          </Text>
                          <Text
                            className="font-poppins-regular text-[16px]"
                            style={{ color: isDark ? '#8AA897' : '#658176' }}
                          >
                            Monthly
                          </Text>
                          <Text
                            className="font-poppins-regular text-[14px] ml-1"
                            style={{ color: isDark ? '#8AA897' : '#658176' }}
                          >
                            {`- ${item.consulationPerMonth} consultations`}
                          </Text>
                        </View>
                        {/* Arrow Icon inside the box, aligned to the right */}
                        <Ionicons name="chevron-forward" size={20} color="#8AA897" />
                      </View>

                      {/* Description: "Then £12/month after 6 months" */}
                      <Text
                        className="font-poppins-regular text-[12px] mt-1"
                        style={{ color: isDark ? '#8AA897' : '#658176' }}
                      >
                        {item.desc}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Current Subscription Info */}
        {currentSubscription?.status === 'active' && (
          <View className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="information-circle" size={20} color="#2563EB" className="mr-2" />
              <Text className="text-blue-800 font-semibold">Active Subscription</Text>
            </View>
            <Text className="text-blue-700 text-sm mt-1">
              You have an active {currentSubscription.plan?.name || 'subscription'}.
              {currentSubscription.plan_id !== selectedPlan?.originalPlan.id
                ? ' Select a different plan to switch your subscription.'
                : ' This is your current plan.'}
            </Text>
          </View>
        )}

        {/* BUTTON */}
        <Button
          text="Continue to Payment"
          onPress={() => {
            if (!selectedPlan) {
              Alert.alert('No Plan Selected', 'Please select a subscription plan first.');
              return;
            }
            setSubscriptionModal(true);
          }}
          className="mt-10 w-full"
        />

        {/* SKIP */}
        <Pressable
          className="mt-4"
          onPress={() => {
            const userRole = user?.role;

            if (userRole === 'consultant') {
              // Navigate to ConsultantTabs and then to ChatTab (consultant's consultation equivalent)
              (navigation as any).navigate('ConsultantTabs', {
                screen: 'ChatTab',
              });
            } else {
              // Navigate to UserTabs and then to ConsultationTab
              (navigation as any).navigate('UserTabs', {
                screen: 'ConsultationTab',
              });
            }
          }}
        >
          <Text
            className="text-center font-bold text-base"
            style={{
              color: isDark ? ThemeColors.text.primary.dark : ThemeColors.text.primary.light,
            }}
          >
            Skip
          </Text>
        </Pressable>
      </View>
      {subscriptionModal && (
        <SubscriptionModal
          plan={selectedPlan}
          onClose={async () => {
            setSubscriptionModal(false);
            // Refresh subscription status after modal closes
            try {
              const subscription = await getCurrentSubscription();
              setCurrentSubscription(subscription);
            } catch (error: any) {
              console.error('[Pricing] Failed to refresh subscription:', error.message);
            }
          }}
        />
      )}
    </GradientBackground>
  );
}
