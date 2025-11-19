import React from "react";
import { View, Text, TextInput, Pressable, Image } from "react-native";
import { useForm, Controller } from "react-hook-form";
import LinearGradient from 'react-native-linear-gradient';

export default function LoginScreen({ navigation }: any) {
    const { control, handleSubmit } = useForm();

    return (
        <LinearGradient
            colors={["#ECFAF5", "#D1F6E7"]} // pick your exact light-green gradient shades
            start={{ x: 0, y: 0 }}
            end={{ x: 2, y: 4 }}
            className="flex-1 px-6"
        >
            <View className="">

                {/* Logo + Headings */}
                <View className="items-center mt-14 mb-10">
                    <Image
                        source={require("../../assets/colored_logo.png")}
                        className="w-[90px] h-[90px]"
                        resizeMode="contain"
                    />

                    <Text className="font-bold text-[24px] text-[#162721] mt-4">
                        Welcome Back
                    </Text>

                    <Text className="font-normal text-[14px] text-[#658176] mt-1">
                        Sign in to continue to StyleHub
                    </Text>
                </View>

                {/* Email Field */}
                <Text className="font-medium text-[14px] text-black mb-2">
                    Email Address
                </Text>

                <View className="flex-row items-center border border-[#DADADA] bg-[#F5F9F7] rounded-xl px-4 h-[52px] mb-5">
                    <Image
                        source={require("../../assets/email.png")}
                        className="w-5 h-5 mr-3"
                    />

                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Enter your email"
                                placeholderTextColor="#94A3B8"
                                className="flex-1 font-normal text-black"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                </View>

                {/* Password Field */}
                <Text className="font-medium text-[14px] text-black mb-2">
                    Password
                </Text>

                <View className="flex-row items-center border border-[#DADADA] bg-[#F5F9F7] rounded-xl px-4 h-[52px]">
                    <Image
                        source={require("../../assets/lock.png")}
                        className="w-5 h-5 mr-3"
                    />

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Enter your password"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry
                                className="flex-1 font-normal text-black"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                </View>

                {/* Forgot Password */}
                <Pressable onPress={() => navigation.navigate('ForgetPassword')} className="mt-4 mb-6 self-end">
                    <Text className="font-normal text-[13px] text-[#27B07D]">
                        Forgot Password?
                    </Text>
                </Pressable>

                {/* Sign In Button — gradient */}
                <Pressable className="rounded-2xl overflow-hidden mb-6">
                    <LinearGradient
                        colors={["#2CCB91", "#23A76F"]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 1, y: 0 }}
                        className="h-[50px] rounded-xl justify-center items-center"
                    >
                        <Text className="text-white font-urbanistBold text-[16px]">
                            Sign In
                        </Text>
                    </LinearGradient>
                </Pressable>

                {/* Sign Up link */}
                <View className="text-center flex flex-row justify-center ">
                    <Text className="text-center text-[#64748B] font-normal text-[14px]">
                        Don’t have an account?{" "}
                    </Text>
                    <Pressable onPress={() => navigation.navigate('Signup')} >
                        <Text className="text-[#27B07D]">Sign Up</Text>
                    </Pressable>
                </View>

                {/* Consultant link */}
                <Text className="text-center mt-3 text-[#162721] font-medium text-[14px]">
                    Want to be a Consultant?{" "}
                    <Text className="text-[#27B07D] font-urbanistSemi">Register here</Text>
                </Text>

            </View>
        </LinearGradient>
    );
}
