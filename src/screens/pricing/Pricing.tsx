import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { finishTransaction } from 'react-native-iap';
import * as RNIap from 'react-native-iap';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import {
  useGetSubscriptionPlans,
  SubscriptionPlan,
} from '@/api/subscription/useGetSubscriptionPlans';
import { Button } from '@/common/components/Button';
import SubscriptionModal from '@/common/components/modals/SubscriptionModal';
import { AppStackParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';
import { restorePurchase, type RestorePurchasePayload } from '@/api/subscription/verifyPurchase';

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
  const [isRestoring, setIsRestoring] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useTheme();
  const isFocused = useIsFocused();
  const {
    data: profileData,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetProfile({
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

  const handleRestorePurchase = async () => {
    try {
      setIsRestoring(true);
      await RNIap.initConnection();

      const availablePurchases = await RNIap.getAvailablePurchases();
      console.log('availablePurchases', availablePurchases);

      if (!availablePurchases || availablePurchases.length === 0) {
        Alert.alert(
          'No History Found',
          "We couldn't find any previous purchases for this account."
        );
        return;
      }

      console.log('availablePurchases', availablePurchases);

      for (const purchase of availablePurchases) {
        console.log('purchase is inside the loop');
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';

        const restorePayload: RestorePurchasePayload = {
          // iOS uses transactionId; Android uses purchaseToken (critical for Google)
          purchaseToken: purchase.purchaseToken,
          transactionId: purchase.transactionId || '',
          platform,
        };

        console.log('restorePayload', restorePayload);

        const result = await restorePurchase(restorePayload);

        if (result.status === 'success') {
          // ✅ MUST finish transaction on BOTH platforms in 2026
          await finishTransaction({ purchase, isConsumable: false });

          // Refetch profile to update subscription status
          await refetchProfile();

          Alert.alert('Restored', 'Your subscription has been successfully restored.');
          return;
        }
      }
    } catch (error: any) {
      // Check for user cancellation to avoid showing "Error" alerts
      if (error.code !== 'E_USER_CANCELLED') {
        Alert.alert('Restore Error', error.message);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // Transform API data to display format and filter out test plans
  const plans = useMemo(() => {
    if (!subscriptionPlans) {
      console.log('[Pricing] No subscription plans data available');
      return [];
    }

    // Filter out test plans
    const filteredPlans = subscriptionPlans.filter((plan) => !plan.slug.includes('-test'));

    // For Android: filter by google_product_id === 'senior_stylist_subscription_v1'
    // For iOS: keep all plans
    const platformFilteredPlans =
      Platform.OS === 'android'
        ? filteredPlans.filter((plan) => plan.google_product_id === 'senior_stylist')
        : filteredPlans;

    const sortedPlans = platformFilteredPlans.sort((a, b) => a.sort_order - b.sort_order);

    // For Android: map the first 3 plans to specific plan IDs and offer IDs
    const withAndroidMapping = (() => {
      if (Platform.OS !== 'android') return sortedPlans;
      if (sortedPlans.length === 0) return sortedPlans;

      // Map first 3 plans to specific plan IDs and offer IDs
      const planMapping = [
        { basePlanId: 'starter', offerId: 'starter-intro-offer' },
        { basePlanId: 'professional', offerId: 'professional-intro-offer' },
        { basePlanId: 'business', offerId: 'business-intro-offer' },
      ];

      return sortedPlans.map((plan, index) => {
        if (index < 3) {
          return {
            ...plan,
            base_plan_product_id: planMapping[index].basePlanId,
            offer_plan_id: planMapping[index].offerId,
          };
        }
        return plan;
      });
    })();

    const mappedPlans = withAndroidMapping.map((plan: SubscriptionPlan) => {
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
        desc: `Then ${formattedMonthlyPrice} / month, billed monthly after ${plan.discount_duration_months} months`,
        formattedPrice, // For displaying large price
        formattedMonthlyPrice, // For displaying regular price
        discountDurationMonths: plan.discount_duration_months, // For displaying discount duration
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
    <GradientBackground>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="pt-6 items-center">
          <Text
            className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
          >
            Choose Your Plan
          </Text>
          <Text
            className={`text-center mt-2 text-sm font-poppins-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
          >
            Select a subscription to get started with expert{'\n'}consultations
          </Text>
        </View>

        {/* OFFER BADGE */}
        <View className="mt-2 items-center">
          <View className="bg-[#E7B008] rounded-xl py-2 px-4 w-60">
            <Text className="text-center text-base font-urbanist-bold text-white">
              Introductory offer: 50% off for first 6 months
              {/* {Platform.OS === 'ios'
                ? 'Available for eligible Apple IDs. Apple determines eligibility.'
                : 'Available for eligible Google accounts. Eligibility is determined by Google Play.'} */}
            </Text>
          </View>
          <Text className="w-80 text-center text-[10px] text-textMuted mt-2 font-poppins-regular">
            {/* Introductory offer available for eligible Apple IDs. Apple determines eligibility. */}
            {Platform.OS === 'ios'
              ? 'Introductory offer available for eligible Apple IDs. Apple determines eligibility.'
              : 'Introductory offer available for eligible Google accounts. Eligibility is determined by Google Play.'}
          </Text>
        </View>

        {/* PLANS */}
        <View className="mt-2 flex flex-col gap-4">
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
                  className={`rounded-md border-2 px-4 py-2.5 ${
                    active ? 'border-[#27B07D]' : isDark ? 'border-[#273F36]' : 'border-[#DAE7E0]'
                  } ${isDark ? 'bg-[#1A2E26]' : 'bg-white'}`}
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
                          className={`font-poppins-medium text-base ${isDark ? 'text-white' : 'text-textDark'}`}
                        >
                          {item.title}
                        </Text>
                        {isCurrentPlan && (
                          <View className="bg-[#23A76F] px-2.5 py-1 rounded-full">
                            <Text className="text-xs font-bold text-white">Current</Text>
                          </View>
                        )}
                      </View>

                      {/* Price: "£6/month for first 6 months, then £12/month" */}
                      <View className="flex-row items-center justify-between mt-1">
                        <View className="flex-1">
                          <Text
                            className={`text-base font-poppins-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                          >
                            <Text
                              className={`font-poppins-semibold text-lg ${isDark ? 'text-white' : 'text-textDark'}`}
                            >
                              {item.formattedPrice}
                            </Text>
                            /month for first {item.discountDurationMonths} months,
                          </Text>
                          <Text
                            className={`text-base font-poppins-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                          >
                            then{' '}
                            <Text
                              className={`font-poppins-semibold text-lg ${isDark ? 'text-white' : 'text-textDark'}`}
                            >
                              {item.formattedMonthlyPrice}
                            </Text>
                            /month
                          </Text>
                          {/* Consultations per month */}
                          <Text
                            className={`text-base font-poppins-regular mt-1 ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                          >
                            {item.consulationPerMonth} consultations per month
                          </Text>
                        </View>
                        {/* Arrow Icon inside the box, aligned to the right */}
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={isDark ? '#8AA897' : '#94A3B8'}
                        />
                      </View>
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

          // Hide button when current plan is selected
          if (isCurrentPlan) {
            return (
              <Pressable
                onPress={navigateToProfileHome}
                className="mt-2 items-center flex-row justify-center gap-2"
              >
                {/* <Ionicons name="close-circle" size={20} color="#F22D2D" /> */}
                <Text className="text-error text-base font-poppins-regular underline">Close</Text>
              </Pressable>
            );
          }

          let buttonText = 'Confirm Subscription';
          if (isUpgrade) {
            buttonText = 'Upgrade';
          } else if (isDowngrade) {
            buttonText = 'Downgrade';
          } else if (hasActiveSubscription) {
            buttonText = 'Switch Plan';
          }

          return (
            <>
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
                disabled={isLoadingSubscription}
                loading={isLoadingSubscription}
                className="mt-3 rounded-xl"
                textClassName="text-[16px]"
              />
              <Button
                text="Restore Purchase"
                onPress={handleRestorePurchase}
                variant="light"
                disabled={isRestoring}
                loading={isRestoring}
                className="mt-3 rounded-xl"
                textClassName="text-[16px]"
              />
              <Pressable
                onPress={navigateToProfileHome}
                className="mt-3 items-center flex-row justify-center gap-2"
              >
                {/* <Ionicons name="close-circle" size={20} color="#F22D2D" /> */}
                <Text className="text-error text-base font-poppins-regular underline">Close</Text>
              </Pressable>
            </>
          );
        })()}

        {/* Subscription Renewal Notice */}
        <View className="mt-2 mb-2 px-4">
          <Text className="text-center text-textMuted text-xs">
            {/* Payment will be charged to your Apple ID account at confirmation of purchase.
            Subscription automatically renews unless cancelled at least 24 hours before the end of
            the current period. */}
            {Platform.OS === 'ios'
              ? 'Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.'
              : 'Payment will be charged to your Google Play account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.'}
          </Text>
        </View>

        {/* Terms of Use and Privacy Policy Links */}
        <View className="flex-row justify-center items-center gap-2 mb-6">
          <Pressable
            onPress={() => {
              Linking.openURL('https://senior-stylist.com/terms-conditions').catch((err) =>
                console.error('Failed to open Terms & Conditions:', err)
              );
            }}
          >
            <Text className="text-textMuted text-xs underline">Terms of Use</Text>
          </Pressable>
          <Text className="text-textMuted text-xs">|</Text>
          <Pressable
            onPress={() => {
              Linking.openURL('https://senior-stylist.com/privacy-policy').catch((err) =>
                console.error('Failed to open Privacy Policy:', err)
              );
            }}
          >
            <Text className="text-textMuted text-xs underline">Privacy Policy</Text>
          </Pressable>
        </View>
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
    </GradientBackground>
  );
}
