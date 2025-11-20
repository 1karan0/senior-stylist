import { View, Text, Pressable } from 'react-native';
import React, { useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import SubscriptionModal from '../../components/modals/SubscriptionModal';

const plans = [
  {
    key: 'starter',
    title: 'Starter',
    price: '£6',
    priceSub: '£12 /month',
    desc: 'Then £12/month after 6 months',
    features: [
      '5 consultations/month',
      'Message-based consultations',
      'Product recommendations',
      'Expert matching system',
    ],
  },
  {
    key: 'professional',
    title: 'Professional',
    price: '£10',
    priceSub: '£20 /month',
    desc: 'Then £16/month after 6 months',
    features: [
      '5 consultations/month',
      'Message-based consultations',
      'Product recommendations',
      'Expert matching system',
    ],
  },
  {
    key: 'business',
    title: 'Business',
    price: '£6',
    priceSub: '£12 /month',
    desc: 'Then £20/month after 6 months',
    features: [
      '5 consultations/month',
      'Message-based consultations',
      'Product recommendations',
      'Expert matching system',
    ],
  },
];

export default function PricingScreen() {
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[number] | null>(
    () => plans.find((p) => p.key === 'professional') ?? null
  );
  const [subscriptionModal, setSubscriptionModal] = useState(false);

  return (
    <LinearGradient
      colors={['#ECFAF5', '#D1F6E7']} // pick your exact light-green gradient shades
      start={{ x: 0, y: 0 }}
      end={{ x: 2, y: 4 }}
      className="flex-1 px-6"
    >
      <View className="">
        {/* HEADER */}
        <View className="mt-14 items-center">
          <Text className="text-[24px] font-bold text-[#162721]">Choose Your Plan</Text>
          <Text className="text-center text-[#658176] mt-2">
            Select a subscription to get started with expert{'\n'}consultations
          </Text>
        </View>

        {/* OFFER BADGE */}
        <View className="mt-6 items-center">
          <View className="bg-[#E7B008] rounded-xl py-2 px-4 w-60">
            <Text className="text-center text-base font-bold text-[#162721]">
              50% OFF - First 6 Months
            </Text>
          </View>
          <Text className="text-sm text-[#658176] mt-2">Minimum 1 year subscription</Text>
        </View>

        {/* PLANS */}
        <View className="mt-8 flex flex-col gap-4">
          {plans.map((item) => {
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
                      <Text className="text-[#162721] font-semibold text-[16px]">{item.title}</Text>

                      <View className="flex-row items-baseline mt-1">
                        <Text className="text-[#162721] font-bold text-[20px]">{item.price}</Text>
                        <Text className="text-[#162721] font-medium ml-1">{item.priceSub}</Text>
                      </View>

                      <Text className="text-[#94A3B8] text-[12px] mt-1">{item.desc}</Text>
                    </View>
                  </View>

                  {/* Arrow */}
                  <Text className="text-[#94A3B8] text-[20px]">{'>'}</Text>
                </View>
              </Pressable>
            );
          })}
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
          <Text className="text-center text-[#162721] font-bold text-base">Skip</Text>
        </Pressable>
      </View>
      {subscriptionModal && (
        <SubscriptionModal plan={selectedPlan} onClose={() => setSubscriptionModal(false)} />
      )}
    </LinearGradient>
  );
}
