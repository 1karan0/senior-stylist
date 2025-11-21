import { View, Text, Image, TextInput, Pressable } from 'react-native';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';

export default function ForgetPasswordScreen({ navigation }: any) {
  const { control, handleSubmit } = useForm();

  const { isDark } = useTheme();
  return (
    <GradientBackground>
      <View className="flex-1 px-6">
        {/* Logo + Headings */}
        <View className="items-center mt-14 mb-10">
          <Image
            source={
              isDark
                ? require('../../assets/icons/dark-logo.png')
                : require('../../assets/icons/colored_logo.png')
            }
            className="w-[90px] h-[90px]"
            resizeMode="contain"
          />

          <Text
            className={`font-bold text-[24px] ${isDark ? 'text-white' : 'text-[#162721]'} mt-4`}
          >
            Forgot Password?
          </Text>

          <Text
            className={`font-normal text-[14px] ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}  mt-1`}
          >
            No worries, we'll send you reset instructions
          </Text>
        </View>

        <Text className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}>
          Email Address
        </Text>

        <View
          className={`flex-row items-center border  ${isDark ? 'bg-[#0E1B16] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DADADA]'}  rounded-xl px-4 h-[52px] mb-5`}
        >
          <Image source={require('../../assets/icons/email.png')} className="w-5 h-5 mr-3" />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor={` ${isDark ? 'text-[#8AA897]' : '#94A3B8'}`}
                className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'} `}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        {/* Sign In Button — gradient */}
        <Pressable
          onPress={() => navigation.navigate('OtpVerification')}
          className="rounded-2xl overflow-hidden mb-6"
        >
          <LinearGradient
            colors={['#2CCB91', '#23A76F']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            className="h-[50px] rounded-xl justify-center items-center"
          >
            <Text className="text-white font-urbanistBold text-[16px]">Send Reset Link</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} className=" self-center">
          <Text className="font-normal text-[13px] text-[#27B07D]">Back to Login</Text>
        </Pressable>
      </View>
    </GradientBackground>
  );
}
