import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useGetSubscriptionPlans,
  SubscriptionPlan,
} from '@/api/subscription/useGetSubscriptionPlans';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import { AppStackParamList } from '@/common/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCurrentSubscription,
  type CurrentSubscription,
} from '@/api/subscription/subscriptionManagement';
import { storage } from '@/services/storage';

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
  const route = useRoute();
  const { user } = useAuth();

  // Check if this is from signup flow or manage subscription
  // Route params can have: fromSignup (from OTP verification) or fromProfile (from Profile tab)
  const routeParams = (route.params as any) || {};
  const routeFromSignup = routeParams.fromSignup;
  const routeFromProfile = routeParams.fromProfile;
  const [fromSignup, setFromSignup] = useState<boolean>(routeFromSignup || false);
  const [fromProfile, setFromProfile] = useState<boolean>(routeFromProfile || false);

  // If fromSignup param not provided, check storage to determine if it's from signup
  // Priority: route params > storage check
  useEffect(() => {
    // If fromProfile is explicitly set, don't check for signup
    if (routeFromProfile) {
      setFromProfile(true);
      setFromSignup(false);
      return;
    }

    if (routeFromSignup !== undefined) {
      setFromSignup(routeFromSignup);
      setFromProfile(false);
    } else {
      // If no explicit params, check storage to determine if it's from signup
      const checkIfFromSignup = async () => {
        try {
          // First check the explicit new signup flag (set during OTP verification)
          const isNewSignup = await storage.getIsNewSignup();
          if (isNewSignup) {
            setFromSignup(true);
            setFromProfile(false);
            // Clear the flag after checking (so it doesn't persist)
            await storage.setIsNewSignup(false);
            return;
          }

          // Fallback: Check subscription status
          const subscription = await storage.getUserSubscription();
          // If no subscription, likely from signup flow
          setFromSignup(!subscription);
          setFromProfile(!!subscription);
        } catch {
          setFromSignup(false);
          setFromProfile(false);
        }
      };
      checkIfFromSignup();
    }
  }, [routeFromSignup, routeFromProfile]);
  const { data: subscriptionPlans, isLoading, error } = useGetSubscriptionPlans();
  const [selectedPlan, setSelectedPlan] = useState<PlanDisplay | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [storedSubscription, setStoredSubscription] = useState<any | null>(null);

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

  // Fetch current subscription status from both API and storage
  useEffect(() => {
    const fetchCurrentSubscription = async () => {
      try {
        setIsLoadingSubscription(true);

        // Try to get from API first
        try {
          const subscription = await getCurrentSubscription();
          setCurrentSubscription(subscription);
          if (subscription) {
            console.log('[Pricing] Current subscription found from API', {
              subscriptionId: subscription.id,
              planId: subscription.plan_id,
              status: subscription.status,
            });
          }
        } catch {
          console.log('[Pricing] No subscription from API, checking storage');
        }

        // Also check storage for locally saved subscription
        const storedSub = await storage.getUserSubscription();
        if (storedSub) {
          setStoredSubscription(storedSub);
          console.log('[Pricing] Subscription found in storage', {
            planId: storedSub.planId,
            planName: storedSub.planName,
            status: storedSub.status,
          });
        }
      } catch (error: any) {
        console.error('[Pricing] Failed to fetch subscription:', error.message);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    fetchCurrentSubscription();
  }, []);

  // Set default selected plan when plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      // Priority: API subscription > Storage subscription
      const activePlanId =
        currentSubscription?.status === 'active'
          ? currentSubscription.plan_id
          : storedSubscription?.status === 'active'
            ? storedSubscription.planId
            : null;

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
  }, [plans, currentSubscription, storedSubscription]);

  return (
    <LinearGradient
      colors={['#ECFAF5', '#D1F6E7']} // pick your exact light-green gradient shades
      start={{ x: 0, y: 0 }}
      end={{ x: 2, y: 4 }}
      className="flex-1 px-6"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        className="flex-1"
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
                // Check if this plan is the user's active subscription (from API or storage)
                // Priority: API subscription > Storage subscription
                const isCurrentPlan =
                  (currentSubscription?.status === 'active' &&
                    currentSubscription.plan_id === item.originalPlan.id) ||
                  (storedSubscription?.status === 'active' &&
                    storedSubscription.planId === item.originalPlan.id);

                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setSelectedPlan(item)}
                    className={`rounded-md border px-4 py-4 ${
                      active ? 'border-[#23A76F]' : 'border-[#E2E8F0]'
                    } bg-white ${isCurrentPlan ? 'bg-green-50' : ''}`}
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
                        <View className="flex-row items-center gap-2">
                          <Text className="text-textDark font-semibold text-lg">{item.title}</Text>
                          {isCurrentPlan && (
                            <View className="bg-[#23A76F] px-2.5 py-1 rounded-full">
                              <Text className="text-white text-xs font-bold">Current</Text>
                            </View>
                          )}
                        </View>

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

          {/* Current Subscription Info */}
          {(currentSubscription?.status === 'active' ||
            storedSubscription?.status === 'active') && (
            <View className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <View className="flex-row items-center mb-1">
                <Ionicons name="information-circle" size={20} color="#2563EB" className="mr-2" />
                <Text className="text-blue-800 font-semibold">Active Subscription</Text>
              </View>
              <Text className="text-blue-700 text-sm mt-1">
                You have an active{' '}
                {currentSubscription?.plan?.name || storedSubscription?.planName || 'subscription'}.
                {currentSubscription?.plan_id !== selectedPlan?.originalPlan.id &&
                storedSubscription?.planId !== selectedPlan?.originalPlan.id
                  ? ' Select a different plan to switch your subscription.'
                  : ' This is your current plan.'}
              </Text>
            </View>
          )}

          {/* BUTTON */}
          {(() => {
            // Determine button state and text
            const activePlanId =
              currentSubscription?.status === 'active'
                ? currentSubscription.plan_id
                : storedSubscription?.status === 'active'
                  ? storedSubscription.planId
                  : null;

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
              <Pressable
                onPress={() => {
                  if (!selectedPlan) {
                    Alert.alert('No Plan Selected', 'Please select a subscription plan first.');
                    return;
                  }
                  setSubscriptionModal(true);
                }}
                className="mt-10 rounded-xl overflow-hidden"
                disabled={isLoadingSubscription || isCurrentPlan}
              >
                <LinearGradient
                  colors={['#2CCB91', '#23A76F']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  className={`h-[52px] rounded-xl items-center justify-center ${
                    isCurrentPlan ? 'opacity-50' : ''
                  }`}
                >
                  <Text className="text-white text-[16px] font-semibold">
                    {isLoadingSubscription ? 'Loading...' : buttonText}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          })()}

          {/* SKIP */}
          <Pressable
            className="mt-4"
            onPress={() => {
              // If from Profile, navigate back to Profile
              if (fromProfile) {
                try {
                  (navigation as any).navigate('UserTabs', {
                    screen: 'ProfileTab',
                    params: {
                      screen: 'Profile',
                    },
                  });
                } catch (err) {
                  console.error('[Pricing] Navigation to Profile error:', err);
                }
                return;
              }

              // Otherwise, navigate to ConsultationTab (from signup flow)
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
      </ScrollView>
      {subscriptionModal && (
        <SubscriptionModal
          plan={selectedPlan}
          onClose={async () => {
            setSubscriptionModal(false);
            // Refresh subscription status after modal closes
            try {
              const subscription = await getCurrentSubscription();
              setCurrentSubscription(subscription);

              // Also refresh from storage
              const storedSub = await storage.getUserSubscription();
              setStoredSubscription(storedSub);

              // Navigate based on source:
              // - From signup: Navigate to ConsultationTab after successful subscription
              // - From Profile: Don't navigate here (handled in onNavigateToProfile callback)
              if (storedSub && !currentSubscription && fromSignup) {
                // User just completed first subscription from signup flow
                // Navigate to ConsultationTab
                setTimeout(() => {
                  try {
                    (navigation as any).navigate('UserTabs', {
                      screen: 'ConsultationTab',
                    });
                  } catch (err) {
                    console.error('[Pricing] Navigation error:', err);
                  }
                }, 500);
              }
            } catch (error: any) {
              console.error('[Pricing] Failed to refresh subscription:', error.message);
            }
          }}
          onNavigateToProfile={() => {
            // Navigate based on source:
            // - From signup: Navigate to ConsultationTab
            // - From Profile: Navigate to Profile tab
            try {
              if (fromProfile) {
                // From Profile/Manage Subscription - go back to Profile
                (navigation as any).navigate('UserTabs', {
                  screen: 'ProfileTab',
                  params: {
                    screen: 'Profile',
                  },
                });
              } else {
                // From signup - go to ConsultationTab
                (navigation as any).navigate('UserTabs', {
                  screen: 'ConsultationTab',
                });
              }
            } catch (err) {
              console.error('[Pricing] Navigation error:', err);
            }
          }}
          fromSignup={fromSignup}
          fromProfile={fromProfile}
        />
      )}
    </LinearGradient>
  );
}
