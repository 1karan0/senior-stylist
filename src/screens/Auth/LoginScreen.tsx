import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    Image,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import LinearGradient from "react-native-linear-gradient";
import axios from "axios";
import { BASE_URL } from "../../config";

export default function LoginScreen({ navigation }: any) {
    const { control, handleSubmit } = useForm();
    const [loading, setLoading] = useState(false);


    // Login Function
    const handleLogin = async (form: any) => {
        try {
            setLoading(true);

            const response = await axios.post(`${BASE_URL}/api/login`, {
                email: form.email,
                password: form.password,
            });

            console.log("Login success:", response.data);

            navigation.navigate("Pricing");

        } catch (err: any) {
            console.log("Login error:", err);
            

            Alert.alert(
                "Login Failed",
                err?.response?.data?.message || "Something feels off."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={["#ECFAF5", "#D1F6E7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 2, y: 4 }}
            className="flex-1 px-6"
        >
            <View>

                {/* Logo & Header */}
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

                {/* Email */}
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
                        rules={{ required: "Email is required" }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Enter your email"
                                placeholderTextColor="#94A3B8"
                                className="flex-1 font-normal text-black"
                                value={value}
                                onChangeText={onChange}
                                keyboardType="email-address"
                            />
                        )}
                    />
                </View>

                {/* Password */}
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
                        rules={{ required: "Password is required" }}
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
                <Pressable
                    onPress={() => navigation.navigate("ForgetPassword")}
                    className="mt-4 mb-6 self-end"
                >
                    <Text className="font-normal text-[13px] text-[#27B07D]">
                        Forgot Password?
                    </Text>
                </Pressable>

                {/* Sign In Button */}
                <Pressable
                    className="rounded-2xl overflow-hidden mb-6"
                    onPress={handleSubmit(handleLogin)}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={["#2CCB91", "#23A76F"]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 1, y: 0 }}
                        className="h-[50px] rounded-xl justify-center items-center"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-[16px]">
                                Sign In
                            </Text>
                        )}
                    </LinearGradient>
                </Pressable>

                {/* Sign Up */}
                <View className="flex-row justify-center">
                    <Text className="text-[#64748B] font-normal text-[14px]">
                        Don’t have an account?{" "}
                    </Text>
                    <Pressable onPress={() => navigation.navigate("Signup",{user:"customer"})}>
                        <Text className="text-[#27B07D]">Sign Up</Text>
                    </Pressable>
                </View>

                {/* Consultant */}
                <View className="flex-row justify-center mt-3">
                    <Text className="text-center  text-[#162721] font-medium text-[14px]">
                    Want to be a Consultant?{" "}
                </Text>
                    <Pressable onPress={() => navigation.navigate("Signup",{user:"consultant"})}>
                        <Text className="text-[#27B07D]">Register here</Text>
                    </Pressable>
                </View>
            </View>
        </LinearGradient>
    );
}
