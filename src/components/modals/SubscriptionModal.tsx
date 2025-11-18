import { View, Text, Pressable } from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

interface SubscriptionModalProps {
    plan: {
        key: string;
        title: string;
        price: string;
        priceSub: string;
        desc: string;
        features: string[];
    } | null;
    onClose?: () => void;
}

export default function SubscriptionModal({ plan, onClose }: SubscriptionModalProps) {
    if (!plan) return null;

    return (
        <View className="absolute inset-0 bg-black/80 items-center justify-center px-6">
            <View className="bg-white w-full rounded-md p-7">

                {/* CLOSE BUTTON */}
                <Pressable onPress={onClose} className="absolute right-4 top-4">
                    <Text className="text-2xl">×</Text>
                </Pressable>

                {/* PLAN TITLE */}
                <Text className="text-[22px] font-bold text-[#27B07D] mb-2">
                    {plan.title}
                </Text>

                {/* PRICES */}
                <View className="flex-row items-baseline gap-1">
                    <Text className="text-[24px] font-bold text-[#162721]">
                        {plan.price}
                    </Text>
                    <Text className="text-[#162721]">{plan.priceSub}</Text>
                </View>

                {/* DESCRIPTION */}
                <Text className="text-[#658176] mt-1 mb-4">
                    {plan.desc}
                </Text>
                {/* FEATURES */}
                <View className="mb-6">
                    {plan.features.map((feature, index) => (
                        <View key={index} className="flex-row items-center mb-2">
                            <Text className="text-[#23A76F] mr-2">✓</Text>
                            <Text className="text-[#162721]">{feature}</Text>
                        </View>
                    ))}
                </View>

                {/* BUTTON */}
                <Pressable className="mt-5 rounded-xl overflow-hidden  ">
                    <LinearGradient
                        colors={["#2CCB91", "#23A76F"]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 1, y: 0 }}
                        className="  rounded-xl items-center justify-center py-2 px-3"
                    >
                        <Text className="text-white text-[16px] font-semibold">
                            Subscribe
                        </Text>
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
}

