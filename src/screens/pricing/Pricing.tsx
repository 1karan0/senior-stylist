import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import {
  useGetSubscriptionPlans,
  SubscriptionPlan,
} from '@/api/subscription/useGetSubscriptionPlans';
import { Button } from '@/common/components/Button';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import { AppStackParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';

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
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanDisplay | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useTheme();
  const isFocused = useIsFocused();
  const { data: profileData, isLoading: isProfileLoading } = useGetProfile({
    // Poll every 5s while Pricing is visible so current plan + button state stay accurate
    refetchInterval: isFocused ? 5_000 : false,
    refetchIntervalInBackground: false,
  });
  const profileSubscription = profileData?.subscription ?? null;
  const { data: subscriptionPlans, isLoading, error } = useGetSubscriptionPlans();
  const navigateToProfileHome = useCallback(() => {
    try {
      // Pricing is customer-only: always route back to customer Profile
      (navigation as any).navigate('UserTabs', {
        screen: 'ProfileTab',
        params: { screen: 'ProfileHome' },
      });
    } catch (err) {
      console.error('[Pricing] Navigation to Profile failed:', err);
    }
  }, [navigation]);

  // Transform API data to display format and filter out test plans
  const plans = useMemo(() => {
    if (!subscriptionPlans) {
      console.log('[Pricing] No subscription plans data available');
      return [];
    }

    const filteredPlans = subscriptionPlans.filter((plan) => !plan.slug.includes('-test'));
    const sortedPlans = filteredPlans.sort((a, b) => a.sort_order - b.sort_order);

    // If backend doesn't return dedicated plan rows for these new Google Play variants,
    // we still want to show them in UI for testing. So we "clone" existing plans and
    // only override the Google Play identifiers used for purchase.
    const withAndroidVariants = (() => {
      if (Platform.OS !== 'android') return sortedPlans;
      if (sortedPlans.length === 0) return sortedPlans;

      const alreadyHasV2 = sortedPlans.some(
        (p: any) => p.google_product_id === 'senior_stylist_subscription_v2'
      );
      if (alreadyHasV2) return sortedPlans;

      const baseTemplate = sortedPlans[0]; // use cheapest plan's price UI
      const premiumTemplate = sortedPlans[sortedPlans.length - 1]; // use highest plan's price UI

      const makeVariant = (
        template: any,
        variantKey: string,
        basePlanId: string,
        offerId: string,
        sortOrderOffset: number
      ) => ({
        ...template,
        // unique slug/key so it renders as a distinct card
        slug: `${template.slug}__${variantKey}`,
        name: `${template.name} (${variantKey})`,
        sort_order: (template.sort_order ?? 0) + sortOrderOffset,
        // Google Play identifiers
        google_product_id: 'senior_stylist_subscription_v2',
        base_plan_product_id: basePlanId,
        offer_plan_id: offerId,
      });

      return [
        ...sortedPlans,
        makeVariant(premiumTemplate, 'v2-base-plan-3', 'base-plan-3', 'offerof-3', 0.01),
        makeVariant(premiumTemplate, 'v2-base-plan-2', 'base-plan-2', 'offerof-2', 0.02),
        makeVariant(premiumTemplate, 'v2-base-plan-1', 'base-plan-1', 'offerof-1', 0.03),
      ];
    })();

    const mappedPlans = withAndroidVariants.map((plan: any) => {
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

    // Return only API plans (no hardcoded plans)
    return mappedPlans;
  }, [subscriptionPlans]);

  // Profile API is the source of truth for subscription status.
  useEffect(() => {
    setIsLoadingSubscription(isProfileLoading);
  }, [isProfileLoading]);

  // Set default selected plan when plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      const activePlanId =
        profileSubscription?.status === 'active' ? profileSubscription.plan_id : null;

      if (activePlanId) {
        const currentPlan = plans.find((p) => p.originalPlan.id === activePlanId);
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
  }, [plans, profileSubscription]);

  return (
    <LinearGradient
      colors={['#ECFAF5', '#D1F6E7']} // pick your exact light-green gradient shades
      start={{ x: 0, y: 0 }}
      end={{ x: 2, y: 4 }}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="pt-6 items-center">
          <Text className="text-[24px] font-bold text-textDark">Choose Your Plan</Text>
          <Text className="text-center text-textMuted mt-2">
            Select a subscription to get started with expert{'\n'}consultations
          </Text>
        </View>

        {/* OFFER BADGE */}
        <View className="mt-3 items-center">
          <View className="bg-commonGradientStop10 rounded-xl py-2 px-4 w-60">
            <Text className="text-center text-base font-urbanist-bold text-white">
              50% OFF - First 6 Months
            </Text>
          </View>
          <Text
            className={`text-sm text-textMuted mt-2 font-poppins-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
          >
            Minimum 1 year subscription
          </Text>
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
              const isCurrentPlan =
                profileSubscription?.status === 'active' &&
                profileSubscription.plan_id === item.originalPlan.id;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setSelectedPlan(item)}
                  className={`rounded-md border-2 px-4 py-4 ${
                    active ? 'border-[#27B07D]' : isDark ? 'border-[#273F36]' : 'border-[#DAE7E0]'
                  } ${isDark ? 'bg-[#1A2E26]' : 'bg-white'} ${isCurrentPlan ? 'bg-commonGradientStop1' : ''}`}
                >
                  <View className="flex-row items-center gap-3">
                    {/* Radio Button */}
                    <View
                      className={`w-5 h-5 rounded-full border border-[#23A76F] items-center justify-center`}
                    >
                      {active && <View className="w-3 h-3 rounded-full bg-commonGradientStop1" />}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className={`font-poppins-medium text-lg ${isDark ? 'text-white' : 'text-textDark'}`}
                        >
                          {item.title}
                        </Text>
                        {isCurrentPlan && (
                          <View className="bg-[#23A76F] px-2.5 py-1 rounded-full">
                            <Text className="text-xs font-bold text-white">Current</Text>
                          </View>
                        )}
                      </View>

                      {/* Price with consultations: "£6/Monthly - 4 consultations" */}
                      <View className="flex-row items-center justify-between mt-1">
                        <View className="flex-row items-center flex-1">
                          <Text
                            className={`font-poppins-semibold text-[22px] ${isDark ? 'text-white' : 'text-textDark'}`}
                          >
                            {item?.price}
                          </Text>
                          <Text
                            className={`font-poppins-regular text-[15px] ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                          >
                            /
                          </Text>
                          <Text
                            className={`font-poppins-regular text-[15px] ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                          >
                            Monthly
                          </Text>
                          <Text
                            className={`font-poppins-regular text-[15px] ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                          >
                            {`- ${item.consulationPerMonth} consultations`}
                          </Text>
                        </View>
                        {/* Arrow Icon inside the box, aligned to the right */}
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={isDark ? '#8AA897' : '#94A3B8'}
                        />
                      </View>

                      {/* Description: "Then £12/month after 6 months" */}
                      <Text
                        className={`text-[13px] font-poppins-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
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

        {/* BUTTON */}
        {(() => {
          // Determine button state and text
          const activePlanId =
            profileSubscription?.status === 'active' ? profileSubscription.plan_id : null;

          const isCurrentPlan = activePlanId === selectedPlan?.originalPlan.id;
          const hasActiveSubscription = !!activePlanId;

          // Find current plan's sort order for comparison
          const currentPlanIndex = hasActiveSubscription
            ? plans.findIndex((p) => p.originalPlan.id === activePlanId)
            : -1;
          const selectedPlanIndex = selectedPlan
            ? plans.findIndex((p) => p.originalPlan.id === selectedPlan.originalPlan.id)
            : -1;

          // Determine if upgrade or downgrade based on sort_order
          // Plans are sorted by sort_order, so higher index = higher tier plan
          // Upgrade: selected plan has higher index (higher tier)
          // Downgrade: selected plan has lower index (lower tier)
          const isUpgrade =
            hasActiveSubscription &&
            currentPlanIndex >= 0 &&
            selectedPlanIndex >= 0 &&
            selectedPlanIndex > currentPlanIndex;
          const isDowngrade =
            hasActiveSubscription &&
            currentPlanIndex >= 0 &&
            selectedPlanIndex >= 0 &&
            selectedPlanIndex < currentPlanIndex;

          let buttonText = 'Continue to Payment';
          if (isCurrentPlan) {
            buttonText = 'Current Plan';
          } else if (isUpgrade) {
            buttonText = 'Upgrade';
          } else if (isDowngrade) {
            buttonText = 'Downgrade';
          } else if (hasActiveSubscription) {
            buttonText = 'Switch Plan';
          }

          return (
            <Button
              text={buttonText}
              onPress={() => {
                if (!selectedPlan) {
                  Alert.alert('No Plan Selected', 'Please select a subscription plan first.');
                  return;
                }
                setSubscriptionModal(true);
              }}
              variant="gradient"
              disabled={isLoadingSubscription || isCurrentPlan}
              loading={isLoadingSubscription}
              className="mt-10 rounded-xl"
              textClassName="text-[16px]"
            />
          );
        })()}

        {/* SKIP */}
        <Pressable
          className="mt-4 mb-6"
          onPress={() => {
            // Simple rule: always take user back to their Profile from Pricing
            navigateToProfileHome();
          }}
        >
          <Text className="text-center text-textDark font-bold text-base">Skip</Text>
        </Pressable>
      </ScrollView>
      {subscriptionModal && (
        <SubscriptionModal
          plan={selectedPlan}
          onClose={async () => {
            setSubscriptionModal(false);
            // Simple rule: always land on Profile after closing purchase flow
            setTimeout(() => {
              navigateToProfileHome();
            }, 300);
          }}
        />
      )}
    </LinearGradient>
  );
}
