import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useGetSubscriptionPlans,
  SubscriptionPlan,
} from '@/api/subscription/useGetSubscriptionPlans';
import SubscriptionModal from '@/components/modals/SubscriptionModal';

interface PlanDisplay {
  key: string;
  title: string;
  price: string;
  priceSub: string;
  desc: string;
  features: string[];
  originalPlan: SubscriptionPlan;
}

export default function PricingScreen() {
  const { data: subscriptionPlans, isLoading, error } = useGetSubscriptionPlans();
  const [selectedPlan, setSelectedPlan] = useState<PlanDisplay | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState(false);

  // Transform API data to display format and filter out test plans
  const plans = useMemo(() => {
    if (!subscriptionPlans) return [];

    return subscriptionPlans
      .filter((plan) => !plan.slug.includes('-test')) // Filter out test plans
      .sort((a, b) => a.sort_order - b.sort_order) // Sort by sort_order
      .map((plan) => ({
        key: plan.slug,
        title: plan.name,
        price: plan.discounted_price_formatted,
        priceSub: `${plan.monthly_price_formatted}/month`,
        desc: `Then ${plan.monthly_price_formatted}/month after ${plan.discount_duration_months} months`,
        features: [
          `${plan.consultations_per_month} consultations/month`,
          'Message-based consultations',
          'Product recommendations',
          'Expert matching system',
        ],
        originalPlan: plan,
      }));
  }, [subscriptionPlans]);

  // Set default selected plan when plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      // Default to the middle plan or first plan
      const defaultPlan = plans[Math.floor(plans.length / 2)] || plans[0];
      setSelectedPlan(defaultPlan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  return (
    <LinearGradient
      colors={['#ECFAF5', '#D1F6E7']} // pick your exact light-green gradient shades
      start={{ x: 0, y: 0 }}
      end={{ x: 2, y: 4 }}
      className="flex-1 px-6"
    >
      <View className="">
        {/* HEADER */}
        <View className="pt-6 items-center">
          <Text className="text-[24px] font-bold text-textDark">Choose Your Plan</Text>
          <Text className="text-center text-textMuted mt-2">
            Select a subscription to get started with expert{'\n'}consultations
          </Text>
        </View>

        {/* OFFER BADGE */}
        <View className="mt-6 items-center">
          <View className="bg-commonGradientStop10 rounded-xl py-2 px-4 w-60">
            <Text className="text-center text-base font-bold text-textDark">
              50% OFF - First 6 Months
            </Text>
          </View>
          <Text className="text-sm text-textMuted mt-2">Minimum 1 year subscription</Text>
        </View>

        {/* PLANS */}
        <View className="mt-8 flex flex-col gap-4">
          {isLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#23A76F" />
              <Text className="text-textMuted mt-4">Loading plans...</Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-8">
              <Text className="text-red-500 text-center">
                Failed to load subscription plans. Please try again.
              </Text>
            </View>
          ) : plans.length === 0 ? (
            <View className="items-center justify-center py-8">
              <Text className="text-textMuted text-center">No subscription plans available.</Text>
            </View>
          ) : (
            plans.map((item) => {
              const active = selectedPlan?.key === item.key;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setSelectedPlan(item)}
                  className={`rounded-md border px-4 py-4 ${
                    active ? 'border-[#23A76F]' : 'border-[#E2E8F0]'
                  } bg-white`}
                >
                  <View className="flex-row items-center justify-between">
                    {/* Left Side */}
                    <View className="flex-row items-center gap-3">
                      {/* Radio Button */}
                      <View
                        className={`w-5 h-5 rounded-full border ${
                          active ? 'border-[#23A76F]' : 'border-[#94A3B8]'
                        } items-center justify-center`}
                      >
                        {active && <View className="w-3 h-3 rounded-full bg-[#23A76F]" />}
                      </View>

                      <View>
                        <Text className="text-textDark font-semibold text-[16px]">
                          {item.title}
                        </Text>

                        <View className="flex-row items-baseline mt-1">
                          <Text className="text-textDark font-bold text-[20px]">{item.price}</Text>
                          <Text className="text-textDark font-medium ml-1">{item.priceSub}</Text>
                        </View>

                        <Text className="text-[#94A3B8] text-[12px] mt-1">{item.desc}</Text>
                        <Text className="text-[#94A3B8] text-[12px] mt-1">
                          {item.originalPlan.description}
                        </Text>
                      </View>
                    </View>

                    {/* Arrow */}
                    <Text className="text-[#94A3B8] text-[20px]">{'>'}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* BUTTON */}
        <Pressable
          onPress={() => setSubscriptionModal(true)}
          className="mt-10 rounded-xl overflow-hidden"
        >
          <LinearGradient
            colors={['#2CCB91', '#23A76F']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            className="h-[52px] rounded-xl items-center justify-center"
          >
            <Text className="text-white text-[16px] font-semibold">Continue to Payment</Text>
          </LinearGradient>
        </Pressable>

        {/* SKIP */}
        <Pressable className="mt-4">
          <Text className="text-center text-textDark font-bold text-base">Skip</Text>
        </Pressable>
      </View>
      {subscriptionModal && (
        <SubscriptionModal plan={selectedPlan} onClose={() => setSubscriptionModal(false)} />
      )}
    </LinearGradient>
  );
}
