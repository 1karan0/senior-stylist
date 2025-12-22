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

  // Transform API data to display format and filter out test plans
  const plans = useMemo(() => {
    if (!subscriptionPlans) {
      console.log('[Pricing] No subscription plans data available');
      return [];
    }

    console.log('[Pricing] Raw subscription plans from API:', subscriptionPlans);

    const filteredPlans = subscriptionPlans.filter((plan) => !plan.slug.includes('-test'));
    console.log('[Pricing] Filtered plans (removed test plans):', filteredPlans.length);

    const sortedPlans = filteredPlans.sort((a, b) => a.sort_order - b.sort_order);
    console.log(
      '[Pricing] Sorted plans by sort_order:',
      sortedPlans.map((p) => p.name)
    );

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

      console.log(`[Pricing] Mapped plan "${plan.name}":`, {
        key: planDisplay.key,
        productIds: {
          apple: plan.apple_product_id,
          google: plan.google_product_id,
        },
        planId: plan.id,
      });

      return planDisplay;
    });

    console.log('[Pricing] Final mapped plans count:', mappedPlans.length);
    return mappedPlans;
  }, [subscriptionPlans]);

  // Set default selected plan when plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      // Default to the middle plan or first plan
      const defaultPlan = plans[Math.floor(plans.length / 2)] || plans[0];
      console.log('[Pricing] Setting default selected plan:', {
        name: defaultPlan.title,
        key: defaultPlan.key,
        productIds: {
          apple: defaultPlan.originalPlan.apple_product_id,
          google: defaultPlan.originalPlan.google_product_id,
        },
      });
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
                  <View className="flex-row items-center gap-3">
                    {/* Radio Button */}
                    <View
                      className={`w-5 h-5 rounded-full border ${
                        active ? 'border-[#23A76F]' : 'border-[#94A3B8]'
                      } items-center justify-center`}
                    >
                      {active && <View className="w-3 h-3 rounded-full bg-[#23A76F]" />}
                    </View>

                    <View className="flex-1">
                      <Text className="text-textDark font-semibold text-lg">{item.title}</Text>

                      {/* Price with consultations: "£6/Monthly - 4 consultations" */}
                      <View className="flex-row items-center justify-between mt-1">
                        <View className="flex-row items-center flex-1">
                          <Text className="text-[#162721] font-medium text-[22px]">
                            {item?.price}
                          </Text>
                          <Text className="text-[#658176] font-medium text-[16px]">/</Text>
                          <Text className="text-[#658176] font-medium text-[16px]">Monthly</Text>
                          <Text className="text-[#658176] font-medium text-[14px] ml-1">
                            {`- ${item.consulationPerMonth} consultations`}
                          </Text>
                        </View>
                        {/* Arrow Icon inside the box, aligned to the right */}
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                      </View>

                      {/* Description: "Then £12/month after 6 months" */}
                      <Text className="text-[#658176] text-[12px] mt-1">{item.desc}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* BUTTON */}
        <Pressable
          onPress={() => {
            console.log('[Pricing] Continue to Payment clicked', {
              selectedPlan: selectedPlan
                ? {
                    name: selectedPlan.title,
                    key: selectedPlan.key,
                    productIds: {
                      apple: selectedPlan.originalPlan.apple_product_id,
                      google: selectedPlan.originalPlan.google_product_id,
                    },
                    planId: selectedPlan.originalPlan.id,
                  }
                : null,
            });
            if (!selectedPlan) {
              Alert.alert('No Plan Selected', 'Please select a subscription plan first.');
              return;
            }
            setSubscriptionModal(true);
          }}
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
        <Pressable
          className="mt-4"
          onPress={() => {
            console.log('[Pricing] Skip button clicked, navigating to Consultation tab');
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
          <Text className="text-center text-textDark font-bold text-base">Skip</Text>
        </Pressable>
      </View>
      {subscriptionModal && (
        <SubscriptionModal
          plan={selectedPlan}
          onClose={() => {
            console.log('[Pricing] SubscriptionModal closed');
            setSubscriptionModal(false);
          }}
        />
      )}
    </LinearGradient>
  );
}
