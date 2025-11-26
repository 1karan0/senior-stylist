import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BASE_URL } from '@/config';
import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';
import Toast from '@/common/components/Toast';

export default function SignupScreen({ navigation, route }: any) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as any,
  });

  const { isDark } = useTheme();

  const user = route.params.user;

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const pickDocument = async () => {
    try {
      const pickerResult = await pick({
        type: [types.allFiles],
        allowMultiSelection: false,
      });

      if (pickerResult && pickerResult.length > 0) {
        setCvFile(pickerResult[0]);
        showToast('CV uploaded successfully', 'success');
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        console.log('User cancelled.');
      } else {
        console.error('Error picking document:', err);
        showToast('Failed to upload CV. Please try again.', 'error');
      }
    }
  };

  const handleSignup = async (form: any) => {
    // Check if CV is required for consultant
    if (user === 'consultant' && !cvFile) {
      showToast('Please upload your CV to continue', 'warning');
      return;
    }

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
      showToast('Account created successfully! Redirecting...', 'success');
      setTimeout(() => {
        navigation.navigate('OtpVerification', { email: form.email, screen: 'signup' });
      }, 1500);
    } catch (err: any) {
      console.log('Signup error:', err.response?.data);
      const errorMessage =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Something went wrong. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          <GradientBackground>
            <Toast
              visible={toast.visible}
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ ...toast, visible: false })}
            />

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
                  className={`font-bold text-[24px] ${
                    isDark ? 'text-white' : 'text-[#162721]'
                  } mt-4`}
                >
                  Create Account
                </Text>

                <Text
                  className={`font-normal text-[14px] ${
                    isDark ? 'text-[#8AA897]' : 'text-[#658176]'
                  }  mt-1`}
                >
                  Join us today
                </Text>
              </View>

              {/* Name Field */}
              <Text
                className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
              >
                Full Name
              </Text>

              <View
                className={`flex-row items-center border ${
                  errors.name
                    ? 'border-red-500'
                    : isDark
                      ? 'bg-[#0E1B16] border-[#273F36]'
                      : 'bg-[#F5F9F7] border-[#DADADA]'
                } rounded-xl px-4 h-[52px] mb-1`}
              >
                <Image source={require('../../assets/icons/user.png')} className="w-5 h-5 mr-3" />

                <Controller
                  control={control}
                  name="name"
                  rules={{
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      placeholder="Enter your Name"
                      placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
                      className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'} `}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
              {errors.name && (
                <Text className="text-red-500 text-[12px] mb-3 ml-1">
                  {errors.name.message as string}
                </Text>
              )}

              {/* Email Field */}
              <Text
                className={`font-medium text-[14px] ${
                  isDark ? 'text-[#ffff]' : 'text-black'
                } mb-2 mt-2`}
              >
                Email Address
              </Text>

              <View
                className={`flex-row items-center border ${
                  errors.email
                    ? 'border-red-500'
                    : isDark
                      ? 'bg-[#0E1B16] border-[#273F36]'
                      : 'bg-[#F5F9F7] border-[#DADADA]'
                } rounded-xl px-4 h-[52px] mb-1`}
              >
                <Image source={require('../../assets/icons/email.png')} className="w-5 h-5 mr-3" />

                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address',
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
                      className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'} `}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                />
              </View>
              {errors.email && (
                <Text className="text-red-500 text-[12px] mb-3 ml-1">
                  {errors.email.message as string}
                </Text>
              )}

              {/* Phone Field */}
              <Text
                className={`font-medium text-[14px] ${
                  isDark ? 'text-[#ffff]' : 'text-black'
                } mb-2 mt-2`}
              >
                Phone Number
              </Text>

              <View
                className={`flex-row items-center border ${
                  errors.phone
                    ? 'border-red-500'
                    : isDark
                      ? 'bg-[#0E1B16] border-[#273F36]'
                      : 'bg-[#F5F9F7] border-[#DADADA]'
                } rounded-xl px-4 h-[52px] mb-1`}
              >
                <Image source={require('../../assets/icons/phone.png')} className="w-5 h-5 mr-3" />

                <Controller
                  control={control}
                  name="phone"
                  rules={{
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10,15}$/,
                      message: 'Please enter a valid phone number (10-15 digits)',
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      placeholder="Enter your phone number"
                      placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
                      keyboardType="number-pad"
                      className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'} `}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
              {errors.phone && (
                <Text className="text-red-500 text-[12px] mb-3 ml-1">
                  {errors.phone.message as string}
                </Text>
              )}

              {/* Password Field */}
              <Text
                className={`font-medium text-[14px] ${
                  isDark ? 'text-[#ffff]' : 'text-black'
                } mb-2 mt-2`}
              >
                Password
              </Text>

              <View
                className={`flex-row items-center border mb-5 ${
                  errors.password
                    ? 'border-red-500'
                    : isDark
                      ? 'bg-[#0E1B16] border-[#273F36]'
                      : 'bg-[#F5F9F7] border-[#DADADA]'
                } rounded-xl px-4 h-[52px] mb-1`}
              >
                <Image source={require('../../assets/icons/lock.png')} className="w-5 h-5 mr-3" />

                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
                      secureTextEntry={!showPassword}
                      className={`flex-1 font-normal ${isDark ? 'text-white' : 'text-black'} `}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {/* Toggle eye button */}
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Image
                    source={
                      showPassword
                        ? require('../../assets/icons/eye-open.png')
                        : require('../../assets/icons/eye-closed.png')
                    }
                    className="w-5 h-5 ml-2"
                  />
                </Pressable>
              </View>
              {errors.password && (
                <Text className="text-red-500 text-[12px] mb-3 ml-1">
                  {errors.password.message as string}
                </Text>
              )}

              {user === 'consultant' && (
                <View className="mb-5 mt-2">
                  <Text
                    className={`font-medium text-[14px] ${
                      isDark ? 'text-[#ffff]' : 'text-black'
                    } mb-2`}
                  >
                    Upload CV
                  </Text>

                  <Pressable
                    onPress={pickDocument}
                    className={`border border-dashed ${
                      isDark ? 'bg-[#0E1B16] border-[#273F36]' : 'bg-[#F5F9F7] border-[#27B07D]'
                    } rounded-lg h-[120px] justify-center items-center`}
                  >
                    <Image
                      source={require('../../assets/icons/upload.png')}
                      className="w-10 h-10 mb-2"
                    />

                    <Text
                      className={` ${isDark ? 'text-white' : 'text-[#162721]'} font-medium text-center px-4`}
                    >
                      {cvFile ? cvFile.name : 'Upload your CV'}
                    </Text>

                    <Text className="text-[#658176] text-[12px] mt-1">.pdf , .docx , .doc</Text>
                  </Pressable>
                </View>
              )}

              {/* Sign Up Button — gradient */}
              <Pressable
                onPress={handleSubmit(handleSignup)}
                className="rounded-lg overflow-hidden mb-6"
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#94A3B8', '#64748B'] : ['#2CCB91', '#23A76F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="h-[50px] justify-center items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-[16px]">Create Account</Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Sign in link */}
              <View className="text-center mb-5 flex flex-row justify-center">
                <Text
                  className={`text-center ${
                    isDark ? 'text-[#8AA897]' : 'text-[#64748B]'
                  } font-normal text-[14px]`}
                >
                  Already have an account?{' '}
                </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text className="text-[#27B07D] font-semibold">Sign In</Text>
                </Pressable>
              </View>
            </View>
          </GradientBackground>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
