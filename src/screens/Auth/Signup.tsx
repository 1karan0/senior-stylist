import React, { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';

import { BASE_URL } from '@/config';
import { useTheme } from '@/contexts/ThemeContext';
import GradientBackground from '@/common/components/GradientBackground';
import Toast from '@/common/components/Toast';
import TextInputField from '@/common/components/TextInputField';
import Button from '@/common/components/Button';

export default function SignupScreen({ navigation, route }: any) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState<any>(null);
  const [cvError, setCvError] = useState<string>('');
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as any,
  });

  const { isDark } = useTheme();
  const user = route.params.user; // expects 'consultant' or other

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
        setCvError('');
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
    // CV required only for consultant
    if (user === 'consultant' && !cvFile) {
      setCvError('CV is required to register as a consultant');
      showToast('Please upload your CV to continue', 'warning');
      return;
    }

    try {
      setLoading(true);
      let response;

      if (user === 'consultant') {
        // Consultant signup: NO referral_code appended
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
        // Normal customer signup: include referral_code only if provided
        const payload: any = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        };

        if (form.referral) {
          payload.referral_code = form.referral;
        }

        console.log(payload, 'payload');

        response = await axios.post(`${BASE_URL}/api/register`, payload);
        console.log(response, 'response');
      }

      console.log('Signup success:', response.data);
      showToast('Account created successfully!', 'success');
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
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
                className={`font-bold text-[24px] ${isDark ? 'text-white' : 'text-textDark'} mt-4`}
              >
                Create Account
              </Text>

              <Text
                className={`font-normal text-[14px] ${isDark ? 'text-textSecondary' : 'text-textMuted'}  mt-1`}
              >
                Join us today
              </Text>
            </View>

            {/* Name */}
            <Controller
              control={control}
              name="name"
              rules={{
                required: 'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInputField
                  label="Full Name"
                  placeholder="Enter your Name"
                  icon={require('../../assets/icons/user.png')}
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message as string}
                />
              )}
            />

            {/* Email */}
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
                <TextInputField
                  label="Email Address"
                  placeholder="Enter your email"
                  icon={require('../../assets/icons/email.png')}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message as string}
                />
              )}
            />

            {/* Phone */}
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
                <TextInputField
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  icon={require('../../assets/icons/phone.png')}
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={onChange}
                  error={errors.phone?.message as string}
                />
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInputField
                  label="Password"
                  placeholder="Enter your password"
                  icon={require('../../assets/icons/lock.png')}
                  value={value}
                  isPassword={true}
                  onChangeText={onChange}
                  error={errors.password?.message as string}
                />
              )}
            />

            {/* Referral: SHOW ONLY WHEN NOT A CONSULTANT */}
            {user !== 'consultant' && (
              <Controller
                control={control}
                name="referral"
                rules={{}}
                render={({ field: { onChange, value } }) => (
                  <TextInputField
                    label="Referral Code (optional)"
                    placeholder="Enter referral code (optional)"
                    // icon={require('../../assets/icons/tag.png')}
                    value={value}
                    onChangeText={onChange}
                    error={errors.referral?.message as string}
                  />
                )}
              />
            )}

            {/* CV upload: only for consultant */}
            {user === 'consultant' && (
              <View className="mb-5 mt-2">
                <Text
                  className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
                >
                  Upload CV <Text className="text-red-500">*</Text>
                </Text>

                <Pressable
                  onPress={pickDocument}
                  className={`border border-dashed ${
                    cvError
                      ? 'border-red-500 bg-red-50'
                      : isDark
                        ? 'bg-commonGradientStop6 border-commonGradientStop7'
                        : 'bg-[#F5F9F7] border-textPrimary'
                  } rounded-lg h-[120px] justify-center items-center`}
                >
                  <Image
                    source={require('../../assets/icons/upload.png')}
                    className="w-10 h-10 mb-2"
                  />

                  <Text
                    className={`${isDark ? 'text-white' : 'text-textDark'} font-medium text-center px-4`}
                  >
                    {cvFile ? cvFile.name : 'Upload your CV'}
                  </Text>

                  <Text className="text-textMuted text-[12px] mt-1">.pdf , .docx , .doc</Text>
                </Pressable>

                {cvError && <Text className="text-red-500 text-[12px] mt-2 ml-1">{cvError}</Text>}
              </View>
            )}

            {/* Sign Up Button */}
            <View className="mt-6">
              <Button
                text="Create Account"
                variant="gradient"
                onPress={handleSubmit(handleSignup)}
                loading={loading}
                disabled={loading}
                className="rounded-lg"
              />
            </View>

            {/* Sign in link */}
            <View className="text-center mt-3 mb-5 flex flex-row justify-center">
              <Text
                className={`text-center ${isDark ? 'text-textSecondary' : 'text-[#64748B]'} font-normal text-[14px]`}
              >
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text className="text-textPrimary font-semibold">Sign In</Text>
              </Pressable>
            </View>
          </View>
        </GradientBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
