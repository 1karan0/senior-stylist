import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, StatusBar, View } from 'react-native';

import { useGetProfile } from '@/api/user/profile/useGetProfile';
import { AppStackParamList } from '@/common/types';
import { useAuth } from '@/contexts/AuthContext';
import { useVerifyExistingPhone } from '@/api/auth/useVerifyExistingPhone';
import PhoneVerificationPrompt from '@/common/components/PhoneVerificationPrompt';
import CompleteQuestions from '@/common/components/CompleteQuestions';
import { storage } from '@/services/storage';

import UserTabNavigator from '@/navigation/UserTabNavigator';
import ConsultantTabNavigator from '@/navigation/ConsultantTabNavigator';
import PricingScreen from '@/screens/pricing/Pricing';
import ConsultantChatScreen from '@/screens/consulant/chat/Conversation';
import GradientBackground from '@/common/components/GradientBackground';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack: React.FC = () => {
  const { user, isGuest } = useAuth();
  const userRole = user?.role; // or 'customer'
  const [initialRoute, setInitialRoute] = useState<keyof AppStackParamList | undefined>(undefined);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [hasShownPhonePrompt, setHasShownPhonePrompt] = useState<boolean | null>(null);

  const needsProfileForSubscription = Boolean(user) && !isGuest && userRole !== 'consultant';
  const shouldFetchProfile = Boolean(user) && !isGuest;

  const {
    data: profileData,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetProfile({
    enabled: shouldFetchProfile,
    refetchOnMount: 'always',
  });
  const verifyExistingPhoneMutation = useVerifyExistingPhone();

  const subscription = profileData?.subscription ?? null;
  const profileUser = profileData?.user;
  const hasActiveSubscription = !!subscription;
  const phoneDisplay = [profileUser?.phone_country_code, profileUser?.phone]
    .filter(Boolean)
    .join(' ')
    .trim();
  const phoneE164 =
    profileUser?.phone_e164 ||
    `${profileUser?.phone_country_code || ''}${profileUser?.phone || ''}`;
  const hasResolvedProfileForPrompt =
    Boolean(user && !isGuest) && !isProfileLoading && profileUser?.id === user?.id;

  const shouldPromptPhoneVerification = Boolean(
    hasResolvedProfileForPrompt && profileUser?.phone && profileUser?.phone_verified_at === null
  );
  const shouldAutoOpenPhonePrompt = shouldPromptPhoneVerification && hasShownPhonePrompt === false;
  const shouldCompleteQuestions = Boolean(
    user &&
    !isGuest &&
    ((user.role === 'customer' && user.customer_questionnaire_completed_at == null) ||
      (user.role === 'consultant' && user.stylist_questionnaire_completed_at === null))
  );

  const handleVerifyExistingPhone = async (firebaseIdToken: string) => {
    await verifyExistingPhoneMutation.mutateAsync(firebaseIdToken);
    await refetchProfile();
  };

  useEffect(() => {
    let cancelled = false;
    const loadPromptState = async () => {
      if (!user || isGuest) {
        if (!cancelled) setHasShownPhonePrompt(null);
        return;
      }
      const alreadyShown = await storage.getPhoneVerifyPromptShown();
      if (!cancelled) setHasShownPhonePrompt(alreadyShown);
    };
    loadPromptState();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest]);

  useEffect(() => {
    if (!shouldAutoOpenPhonePrompt) return;
    setHasShownPhonePrompt(true);
    storage.setPhoneVerifyPromptShown(true).catch(() => {
      /* ignore */
    });
  }, [shouldAutoOpenPhonePrompt]);

  // Determine initial route based on user role and subscription status
  useEffect(() => {
    const determineInitialRoute = () => {
      // For guest users, go to UserTabs (which will show StoreTab)
      if (!user && isGuest) {
        setInitialRoute('UserTabs');
        setIsCheckingSubscription(false);
        return;
      }

      if (!user) {
        setIsCheckingSubscription(false);
        return;
      }

      // For consultants, always go to ConsultantTabs
      if (userRole === 'consultant') {
        setInitialRoute('ConsultantTabs');
        setIsCheckingSubscription(false);
        return;
      }

      // Customers: wait for profile — otherwise subscription is undefined and we incorrectly pick Pricing
      if (needsProfileForSubscription && isProfileLoading) {
        return;
      }

      if (hasActiveSubscription) {
        setInitialRoute('UserTabs');
        setIsCheckingSubscription(false);
        return;
      }

      setInitialRoute('Pricing');
      setIsCheckingSubscription(false);
    };

    determineInitialRoute();
  }, [
    user,
    isGuest,
    userRole,
    needsProfileForSubscription,
    isProfileLoading,
    hasActiveSubscription,
  ]);

  // Note: We use initialRouteName to set Pricing as the initial route
  // React Navigation handles the navigation automatically, no manual navigation needed

  // Show loading while checking subscription
  if (isCheckingSubscription) {
    return null; // Or a loading indicator
  }

  // Determine default initial route
  const defaultInitialRoute: keyof AppStackParamList =
    initialRoute || (userRole === 'consultant' ? 'ConsultantTabs' : 'UserTabs');
  const isAndroidBelow13 = Platform.OS === 'android' && Number(Platform.Version) < 33;

  return (
    <>
      <GradientBackground
        edges={shouldCompleteQuestions ? ['top', 'left', 'right'] : ['left', 'right']}
      >
        <View className={`flex-1 ${isAndroidBelow13 && shouldCompleteQuestions ? 'pt-16' : ''}`}>
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={defaultInitialRoute}
          >
            {/* Conditionally show only one tab navigator based on user role */}
            {userRole === 'consultant' ? (
              <Stack.Screen name="ConsultantTabs" component={ConsultantTabNavigator} />
            ) : (
              <Stack.Screen name="UserTabs" component={UserTabNavigator} />
            )}
            {/* Shared chat screen (used by both consultants and customers) */}
            <Stack.Screen name="ConsultantChat" component={ConsultantChatScreen} />
            <Stack.Screen name="Pricing" component={PricingScreen} />
          </Stack.Navigator>
        </View>
      </GradientBackground>

      {shouldPromptPhoneVerification ? (
        <PhoneVerificationPrompt
          phoneE164={phoneE164}
          phoneDisplay={phoneDisplay}
          isSubmitting={verifyExistingPhoneMutation.isPending}
          onVerifyToken={handleVerifyExistingPhone}
          showBanner={false}
          autoOpenIntro={shouldAutoOpenPhonePrompt}
        />
      ) : null}

      {shouldCompleteQuestions ? (
        <View className={`absolute left-4 right-4 z-50 ${isAndroidBelow13 ? 'top-4' : 'top-14'}`}>
          <CompleteQuestions
            title="Complete your questions"
            subtitle="for better results"
            iconName="clipboard-outline"
          />
        </View>
      ) : null}
    </>
  );
};

export default AppStack;
