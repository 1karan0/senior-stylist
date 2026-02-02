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
  formattedPrice: string;
  formattedMonthlyPrice: string;
  discountDurationMonths: number;
  storeProduct?: RNIap.Product | RNIap.Subscription;
}

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'Pricing'>;

export default function PricingScreen() {
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanDisplay | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [isFetchingStore, setIsFetchingStore] = useState(false);

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

  // Fetch store products to get localized pricing and offers
  useEffect(() => {
    const fetchStoreProducts = async () => {
      if (!subscriptionPlans || subscriptionPlans.length === 0) return;

      try {
        setIsFetchingStore(true);
        await RNIap.initConnection();

        const skus = subscriptionPlans
          .map((plan) => (Platform.OS === 'ios' ? plan.apple_product_id : plan.google_product_id))
          .filter((sku): sku is string => !!sku && sku.trim() !== '');

        if (skus.length > 0) {
          const products = await RNIap.fetchProducts({
            skus,
            type: 'subs',
          });
          console.log('[Pricing] Store products fetched:', products);
          console.log('[Pricing] Store products fetched:', products?.length);
          if (products) {
            setStoreProducts(products);
          }
        }
      } catch (err) {
        console.error('[Pricing] Error fetching store products:', err);
      } finally {
        setIsFetchingStore(false);
      }
    };

    fetchStoreProducts();
  }, [subscriptionPlans]);

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

      if (!availablePurchases || availablePurchases.length === 0) {
        Alert.alert(
          'No History Found',
          "We couldn't find any previous purchases for this account."
        );
        return;
      }

      for (const purchase of availablePurchases) {
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';

        const restorePayload: RestorePurchasePayload = {
          // iOS uses transactionId; Android uses purchaseToken (critical for Google)
          purchaseToken: purchase.purchaseToken,
          transactionId: purchase.transactionId || '',
          platform,
        };

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

    // For Android: filter plans that have google_product_id
    // For iOS: keep all plans (they use apple_product_id)
    const platformFilteredPlans =
      Platform.OS === 'android'
        ? filteredPlans.filter(
            (plan) => plan.google_product_id && plan.google_product_id.trim() !== ''
          )
        : filteredPlans;

    const sortedPlans = platformFilteredPlans.sort((a, b) => a.sort_order - b.sort_order);

    const mappedPlans = sortedPlans.map((plan: SubscriptionPlan) => {
      // Find matching store product
      const productId = Platform.OS === 'ios' ? plan.apple_product_id : plan.google_product_id;
      const storeProduct = storeProducts.find((p: any) => (p.productId || p.sku) === productId);

      // Helper function to remove decimals from price
      const formatPriceWithoutDecimals = (priceString: string): string => {
        if (!priceString) return '';
        const priceMatch = priceString.match(/([^0-9]*)([\d,]+\.?\d*)/);
        if (priceMatch) {
          const currencySymbol = priceMatch[1].trim();
          const numericValue = parseFloat(priceMatch[2].replace(/,/g, ''));
          const priceValue =
            numericValue % 1 === 0 ? Math.floor(numericValue).toString() : numericValue.toString();
          return `${currencySymbol}${priceValue}`;
        }
        return priceString;
      };

      let formattedPrice = '';
      let formattedMonthlyPrice = '';
      let discountDurationMonths = 0;

      // If store product is available, use its pricing
      if (storeProduct) {
        if (Platform.OS === 'ios') {
          const iosProduct = storeProduct as any;
          console.log('[Pricing] iOS product:', iosProduct);
          formattedMonthlyPrice = iosProduct.localizedPrice;

          // Check for introductory offer on iOS
          if (iosProduct.introductoryPrice) {
            formattedPrice = iosProduct.introductoryPrice;
            // introductoryPriceNumberOfPeriodsIOS is the number of periods
            discountDurationMonths =
              Number(iosProduct.introductoryPriceNumberOfPeriodsIOS) ||
              plan.discount_duration_months;
          } else {
            formattedPrice = formattedMonthlyPrice;
            discountDurationMonths = plan.discount_duration_months;
          }
        } else {
          // Android
          const androidProduct = storeProduct as any;
          console.log('[Pricing] Android product:', androidProduct);
          const offers =
            androidProduct.subscriptionOfferDetailsAndroid ||
            androidProduct.subscriptionOfferDetails ||
            androidProduct.subscriptionOffers ||
            [];

          // Find the matching offer based on base_plan_product_id
          const matchingOffer =
            offers.find((o: any) => o.basePlanId === plan.base_plan_product_id) || offers[0];

          if (matchingOffer) {
            // Get the last phase (usually the recurring one) for monthly price
            const recurringPhase =
              matchingOffer.pricingPhases.pricingPhaseList[
                matchingOffer.pricingPhases.pricingPhaseList.length - 1
              ];
            formattedMonthlyPrice = formatPriceWithoutDecimals(recurringPhase.formattedPrice);

            // Check if there's an introductory/discounted phase (first phase)
            if (matchingOffer.pricingPhases.pricingPhaseList.length > 1) {
              const introPhase = matchingOffer.pricingPhases.pricingPhaseList[0];
              formattedPrice = formatPriceWithoutDecimals(introPhase.formattedPrice);

              // Extract duration from ISO 8601 duration (e.g., P6M)
              const durationMatch = introPhase.billingPeriod.match(/P(\d+)M/);
              if (durationMatch) {
                discountDurationMonths = parseInt(durationMatch[1], 10);
              } else {
                discountDurationMonths = plan.discount_duration_months;
              }
            } else {
              formattedPrice = formattedMonthlyPrice;
              discountDurationMonths = plan.discount_duration_months;
            }
          } else {
            // Fallback to API if no offer found
            formattedPrice = formatPriceWithoutDecimals(plan.discounted_price_formatted);
            formattedMonthlyPrice = formatPriceWithoutDecimals(plan.monthly_price_formatted);
            discountDurationMonths = plan.discount_duration_months;
          }
        }
      } else {
        // Fallback to API pricing if store product is not available
        formattedPrice = formatPriceWithoutDecimals(plan.discounted_price_formatted);
        formattedMonthlyPrice = formatPriceWithoutDecimals(plan.monthly_price_formatted);
        discountDurationMonths = plan.discount_duration_months;
      }

      // Final cleanup of price formatting
      formattedPrice = formatPriceWithoutDecimals(formattedPrice);
      formattedMonthlyPrice = formatPriceWithoutDecimals(formattedMonthlyPrice);

      // Format: "£6/Monthly - 4 consultations"
      const priceWithConsultations = `${formattedPrice}/Monthly - ${plan.consultations_per_month} consultations`;

      const planDisplay: PlanDisplay = {
        key: plan.slug,
        title: plan.name,
        price: formattedPrice, // Just the price number without decimals
        priceSub: `${formattedMonthlyPrice}/month`, // Kept for SubscriptionModal compatibility
        priceWithConsultations, // Full price line with consultations
        desc: `Then ${formattedMonthlyPrice} / month, billed monthly after ${discountDurationMonths} months`,
        formattedPrice, // For displaying large price
        formattedMonthlyPrice, // For displaying regular price
        discountDurationMonths, // For displaying discount duration
        features: [
          `${plan.consultations_per_month} consultations/month`,
          'Message-based consultations',
          'Product recommendations',
          'Expert matching system',
        ],
        consulationPerMonth: plan.consultations_per_month,
        originalPlan: plan,
        storeProduct: storeProduct as RNIap.Product | RNIap.Subscription, // Pass the store product data
      };

      return planDisplay;
    });

    // Return only API plans (no hardcoded plans)
    return mappedPlans;
  }, [subscriptionPlans, storeProducts]);

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
              const termsUrl =
                Platform.OS === 'ios'
                  ? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
                  : 'https://senior-stylist.com/terms-conditions';
              Linking.openURL(termsUrl).catch((err) =>
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
