import React from "react";
import { View, Text, TextInput, Pressable, Image } from "react-native";
import { useForm, Controller } from "react-hook-form";
import LinearGradient from 'react-native-linear-gradient';

export default function SignupScreen({ navigation }: any) {
    const { control, handleSubmit } = useForm();

    return (
        <View className="flex-1 bg-white px-6">

            {/* Logo + Headings */}
            <View className="items-center mt-14 mb-10">
                <Image
                    source={require("../../assets/colored_logo.png")}
                    className="w-[90px] h-[90px]"
                    resizeMode="contain"
                />

                <Text className="font-bold text-[24px] text-[#162721] mt-4">
                    Create Account
                </Text>

                <Text className="font-normal text-[14px] text-[#658176] mt-1">
                    Join us today
                </Text>
            </View>

            {/* Name Field */}
            <Text className="font-medium text-[14px] text-black mb-2">
                Full Name
            </Text>

            <View className="flex-row items-center border border-[#DADADA] bg-[#F5F9F7] rounded-xl px-4 h-[52px] mb-5">
                <Image
                    source={require("../../assets/user.png")}
                    className="w-5 h-5 mr-3"
                />

                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            placeholder="Enter your Name"
                            placeholderTextColor="#94A3B8"
                            className="flex-1 font-normal text-black"
                            value={value}
                            onChangeText={onChange}
                        />
                    )}
                />
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

            {/* Phone Field */}
            <Text className="font-medium text-[14px] text-black mb-2">
                Phone Number
            </Text>

            <View className="flex-row items-center border border-[#DADADA] bg-[#F5F9F7] rounded-xl px-4 h-[52px] mb-5">
                <Image
                    source={require("../../assets/phone.png")}
                    className="w-5 h-5 mr-3"
                />

                <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            placeholder="Enter your phone number"
                            placeholderTextColor="#94A3B8"
                            keyboardType="number-pad"
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

            <View className="flex-row items-center border border-[#DADADA] bg-[#F5F9F7] rounded-xl px-4 h-[52px] mb-5">
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

            {/* Sign Un Button — gradient */}
            <Pressable className="rounded-2xl overflow-hidden mb-6">
                <LinearGradient
                    colors={["#2CCB91", "#23A76F"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="h-[50px] rounded-xl justify-center items-center"
                >
                    <Text className="text-white font-urbanistBold text-[16px]">
                        Create Account
                    </Text>
                </LinearGradient>
            </Pressable>

            {/* Sign Up link */}
            <View className="text-center flex flex-row justify-center ">
                <Text className="text-center text-[#64748B] font-normal text-[14px]">
                Already have an account?{" "}
            </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
                <Text className="text-[#27B07D] font-urbanistSemi">Sign In</Text>
            </Pressable>
            </View>



        </View>
    );
}
