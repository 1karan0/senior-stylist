import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useForm, Controller, set } from 'react-hook-form';
import LinearGradient from 'react-native-linear-gradient';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import axios from 'axios';

import { BASE_URL } from '@/config';

export default function SignupScreen({ navigation, route }: any) {
  const { control, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState<any>(null);

  const user = route.params.user;

  const pickDocument = async () => {
    try {
      const pickerResult = await pick({
        type: [types.allFiles],
        allowMultiSelection: false,
      });

      if (pickerResult && pickerResult.length > 0) {
        setCvFile(pickerResult[0]); // <-- FIX
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        console.log('User cancelled.');
      } else {
        console.error('Error picking document:', err);
      }
    }
  };

  const handleSignup = async (form: any) => {
    try {
      setLoading(true);

      let response;

      if (user === 'consultant') {
        const data = new FormData();

        data.append('name', form.name);
        data.append('email', form.email);
        data.append('phone', form.phone);
        data.append('password', form.password);

        if (cvFile) {
          const fileToUpload = {
            uri: cvFile.uri,
            name: cvFile.name,
            type: cvFile.type,
          };

          data.append('cv', fileToUpload);
        }

        response = await axios.post(`${BASE_URL}/api/consultant/register`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // normal customer
        response = await axios.post(`${BASE_URL}/api/register`, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        });
      }

      console.log('Signup success:', response.data);
      navigation.navigate('OtpVerification', { email: form.email });
    } catch (err: any) {
      console.log('Signup error:', err);
      Alert.alert('Signup Failed', err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      <LinearGradient
        colors={['#ECFAF5', '#D1F6E7']} // pick your exact light-green gradient shades
        start={{ x: 0, y: 0 }}
        end={{ x: 2, y: 4 }}
        className="flex-1 px-6"
      >
        <View className="">
          {/* Logo + Headings */}
          <View className="items-center mt-14 mb-10">
            <Image
              source={require('@/assets/colored_logo.png')}
              className="w-[90px] h-[90px]"
              resizeMode="contain"
            />

            <Text className="font-bold text-[24px] text-[#162721] mt-4">Create Account</Text>

            <Text className="font-normal text-[14px] text-[#658176] mt-1">Join us today</Text>
          </View>

          {/* Name Field */}
          <Text className="font-medium text-[14px] text-black mb-2">Full Name</Text>

          <View className="flex-row items-center border border-[#DADADA] bg-[#F5F9F7] rounded-xl px-4 h-[52px] mb-5">
            <Image source={require('../../assets/user.png')} className="w-5 h-5 mr-3" />

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
          <Text className="font-medium text-[14px] text-black mb-2">Email Address</Text>

          <View className="flex-row items-center border border-[#DADADA] bg-[#F5F9F7] rounded-xl px-4 h-[52px] mb-5">
            <Image source={require('../../assets/email.png')} className="w-5 h-5 mr-3" />

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
          <Text className="font-medium text-[14px] text-black mb-2">Phone Number</Text>

          <View className="flex-row items-center border border-[#DADADA] bg-[#F5F9F7] rounded-xl px-4 h-[52px] mb-5">
            <Image source={require('../../assets/phone.png')} className="w-5 h-5 mr-3" />

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
          <Text className="font-medium text-[14px] text-black mb-2">Password</Text>

          <View className="flex-row items-center border border-[#DADADA] bg-[#F5F9F7] rounded-xl px-4 h-[52px] mb-5">
            <Image source={require('../../assets/lock.png')} className="w-5 h-5 mr-3" />

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
          {user === 'consultant' && (
            <View className="mb-5">
              <Text className="font-medium text-[14px] text-black mb-2">Upload CV</Text>

              <Pressable
                onPress={pickDocument}
                className="border border-dashed border-[#27B07D] bg-[#F5F9F7] rounded-lg h-[120px] justify-center items-center"
              >
                <Image source={require('../../assets/upload.png')} className="w-10 h-10 mb-2" />

                <Text className="text-[#162721] font-medium">
                  {cvFile ? cvFile.name : 'Upload your CV'}
                </Text>

                <Text className="text-[#658176] text-[12px]">.pdf , .docx , .doc</Text>
              </Pressable>
            </View>
          )}

          {/* Sign Un Button — gradient */}
          <Pressable
            onPress={handleSubmit(handleSignup)}
            className=" rounded-lg overflow-hidden mb-6"
          >
            <LinearGradient
              colors={['#2CCB91', '#23A76F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-[50px]  justify-center items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-urbanistBold text-[16px]">Create Account</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Sign Up link */}
          <View className="text-center mb-5 flex flex-row justify-center ">
            <Text className="text-center text-[#64748B] font-normal text-[14px]">
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text className="text-[#27B07D] font-urbanistSemi">Sign In</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}
