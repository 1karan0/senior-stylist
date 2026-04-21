import React, { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';

import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import TextInputField from '@/common/components/TextInputField';
import Toast from '@/common/components/Toast';
import PhoneNumberInput from '@/common/components/PhoneNumberInput';
import { useTheme } from '@/contexts/ThemeContext';
import { requestStoragePermission, showPermissionDeniedAlert } from '@/utils/imagePermissions';
import { Platform } from 'react-native';
import { useTabletLayout } from '@/hooks/useTabletLayout';

export default function SignupScreen({ navigation, route }: any) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState<any>(null);
  const [cvError, setCvError] = useState<string>('');
  const [photoIdFile, setPhotoIdFile] = useState<any>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as any,
  });
  const [selectedCallingCode, setSelectedCallingCode] = useState<any>(null);
  const [belongsToSalon, setBelongsToSalon] = useState<boolean | null>(false);
  const [hasMinimumSalonExperience, setHasMinimumSalonExperience] = useState<boolean | null>(null);
  const [isTechCapable, setIsTechCapable] = useState<boolean | null>(null);
  const [salonExperienceError, setSalonExperienceError] = useState<string>('');
  const [techCapabilityError, setTechCapabilityError] = useState<string>('');

  const { isDark } = useTheme();
  const user = route.params.user; // expects 'consultant' or other
  const isConsultant = user === 'consultant';
  const { horizontalPadding } = useTabletLayout();
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const pickDocument = async () => {
    try {
      // Request storage permission before picking document (Android < 13)
      if (Platform.OS === 'android') {
        const androidVersion =
          typeof Platform.Version === 'number'
            ? Platform.Version
            : parseInt(String(Platform.Version), 10);
        if (androidVersion < 33) {
          const hasPermission = await requestStoragePermission();
          if (!hasPermission) {
            showPermissionDeniedAlert('storage');
            return;
          }
        }
      }

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
        // User cancelled, no action needed
      } else {
        console.error('Error picking document:', err);
        // Check if error is related to permissions
        if (
          err?.message?.toLowerCase().includes('permission') ||
          err?.code?.includes('permission')
        ) {
          showPermissionDeniedAlert('storage');
        } else {
          showToast('Failed to upload CV. Please try again.', 'error');
        }
      }
    }
  };

  const pickPhotoIdDocument = async () => {
    try {
      if (Platform.OS === 'android') {
        const androidVersion =
          typeof Platform.Version === 'number'
            ? Platform.Version
            : parseInt(String(Platform.Version), 10);
        if (androidVersion < 33) {
          const hasPermission = await requestStoragePermission();
          if (!hasPermission) {
            showPermissionDeniedAlert('storage');
            return;
          }
        }
      }

      const pickerResult = await pick({
        type: [types.allFiles],
        allowMultiSelection: false,
      });

      if (pickerResult && pickerResult.length > 0) {
        setPhotoIdFile(pickerResult[0]);
        showToast('Photo ID uploaded successfully', 'success');
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        // User cancelled, no action needed
      } else {
        console.error('Error picking photo ID document:', err);
        if (
          err?.message?.toLowerCase().includes('permission') ||
          err?.code?.includes('permission')
        ) {
          showPermissionDeniedAlert('storage');
        } else {
          showToast('Failed to upload Photo ID. Please try again.', 'error');
        }
      }
    }
  };

  const handleSignup = async (form: any) => {
    // CV required only for consultant
    if (isConsultant && !cvFile) {
      setCvError('CV is required to register as a consultant');
      showToast('Please upload your CV to continue', 'warning');
      return;
    }

    if (isConsultant && hasMinimumSalonExperience === null) {
      setSalonExperienceError('Please confirm your salon experience.');
      showToast('Please confirm your salon experience.', 'warning');
      return;
    }

    if (isConsultant && isTechCapable === null) {
      setTechCapabilityError('Please confirm your tech capability.');
      showToast('Please confirm your tech capability.', 'warning');
      return;
    }

    try {
      setLoading(true);

      const callingCode = selectedCallingCode?.callingCode ?? '';
      const signupData: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        phone_country_code: callingCode,
        password: form.password,
      };

      console.log(signupData, 'signupData');

      if (isConsultant) {
        // Consultant signup: include CV if available
        if (cvFile) {
          signupData.cv = {
            uri: cvFile.uri,
            name: cvFile.name,
            type: cvFile.type,
          };
        }
        if (photoIdFile) {
          signupData.photo_id = {
            uri: photoIdFile.uri,
            name: photoIdFile.name,
            type: photoIdFile.type,
          };
        }
        signupData.has_minimum_salon_experience = hasMinimumSalonExperience;
        signupData.is_tech_capable = isTechCapable;
        if (belongsToSalon && form.salonName?.trim()) {
          signupData.salon_name = form.salonName.trim();
        }
        if (form.referral?.trim()) {
          signupData.referral_code = form.referral.trim();
        }
      } else {
        // Customer signup: include referral_code if provided
        if (form.referral) {
          signupData.referral_code = form.referral;
        }
      }
      console.log(signupData, 'signupData');

      const cc = selectedCallingCode?.callingCode ?? '';
      const countryCode = cc.startsWith('+') ? cc : cc ? `+${cc}` : '+44';
      const rawPhone = String(form.phone ?? '').replace(/\D/g, '');
      const phoneE164 = `${countryCode}${rawPhone}`;
      navigation.navigate('OtpVerification', {
        name: form.name,
        email: form.email,
        phoneE164,
        countryCode,
        rawPhone,
        referral: form.referral?.trim(),
        screen: 'signup',
        isConsultant,
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Something went wrong. Please try again.';
      console.error('Signup error:', err);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <GradientBackground>
          <View className="flex-1" style={[{ paddingHorizontal: horizontalPadding }]}>
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

            {/* Phone Number */}
            <Controller
              control={control}
              name="phone"
              rules={{
                required: 'Phone number is required',
                minLength: { value: 7, message: 'Too short' },
                maxLength: { value: 15, message: 'Too long' },
              }}
              render={({ field: { onChange, value } }) => (
                <PhoneNumberInput
                  label="Phone Number"
                  value={value}
                  error={errors.phone?.message as string}
                  onPhoneChange={(country, phone) => {
                    setSelectedCallingCode(country);
                    onChange(phone);
                  }}
                  onFocus={() => {}}
                  onBlur={() => {}}
                />
              )}
            />

            {/* Password */}
            {isConsultant && (
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
            )}

            {/* Consultant: Do you belong to a salon? + Salon Code + Referral Code */}
            {isConsultant && (
              <>
                <View className="mb-3 mt-3">
                  <Text
                    className={`font-medium mb-3 text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
                  >
                    Do you work for any salon?
                  </Text>
                  <View className="flex-row gap-3 w-[50%] items-center justify-center ">
                    <Pressable
                      onPress={() => setBelongsToSalon(true)}
                      className={`flex-1 py-3 rounded-[14px] border ${
                        belongsToSalon === true
                          ? 'bg-textPrimary border-textPrimary'
                          : isDark
                            ? 'border-commonGradientStop7 bg-commonGradientStop6'
                            : 'border-[#DADADA] bg-[#F5F9F7]'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          belongsToSalon === true
                            ? 'text-white'
                            : isDark
                              ? 'text-white'
                              : 'text-textDark'
                        }`}
                      >
                        Yes
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setBelongsToSalon(false)}
                      className={`flex-1 py-3 rounded-[14px] border ${
                        belongsToSalon === false
                          ? 'bg-textPrimary border-textPrimary'
                          : isDark
                            ? 'border-commonGradientStop7 bg-commonGradientStop6'
                            : 'border-[#DADADA] bg-[#F5F9F7]'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          belongsToSalon === false
                            ? 'text-white'
                            : isDark
                              ? 'text-white'
                              : 'text-textDark'
                        }`}
                      >
                        No
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {belongsToSalon === true && (
                  <Controller
                    control={control}
                    name="salonName"
                    rules={{
                      required: 'Salon name is required',
                      minLength: { value: 2, message: 'Salon name must be at least 2 characters' },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <TextInputField
                        label="Salon Name"
                        placeholder="Enter your salon name"
                        value={value ?? ''}
                        onChangeText={onChange}
                        error={errors.salonName?.message as string}
                      />
                    )}
                  />
                )}

                <Controller
                  control={control}
                  name="referral"
                  rules={{}}
                  render={({ field: { onChange, value } }) => (
                    <TextInputField
                      label="Referral Code (optional)"
                      placeholder="Enter referral code (optional)"
                      value={value}
                      onChangeText={onChange}
                      error={errors.referral?.message as string}
                    />
                  )}
                />
              </>
            )}

            {/* Referral: SHOW ONLY WHEN NOT A CONSULTANT */}
            {!isConsultant && (
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
            {isConsultant && (
              <>
                <View className="mb-3 mt-2">
                  <Text
                    className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
                  >
                    Upload CV <Text className="text-red-500">*</Text>
                  </Text>

                  <Pressable
                    onPress={pickDocument}
                    className={`border border-dashed ${
                      cvError
                        ? 'border-red-500'
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

                <View className="mb-3 mt-2">
                  <Text
                    className={`font-medium mb-3 text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
                  >
                    5-10 Years Salon Experience
                    <Text className="text-red-500"> *</Text>
                  </Text>
                  <View className="flex-row gap-3 w-[100%] items-center justify-center ">
                    <Pressable
                      onPress={() => {
                        setHasMinimumSalonExperience(true);
                        setSalonExperienceError('');
                      }}
                      className={`flex-1 py-3 rounded-[14px] border ${
                        hasMinimumSalonExperience === true
                          ? 'bg-textPrimary border-textPrimary'
                          : isDark
                            ? 'border-commonGradientStop7 bg-commonGradientStop6'
                            : 'border-[#DADADA] bg-[#F5F9F7]'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          hasMinimumSalonExperience === true
                            ? 'text-white'
                            : isDark
                              ? 'text-white'
                              : 'text-textDark'
                        }`}
                      >
                        Yes
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setHasMinimumSalonExperience(false);
                        setSalonExperienceError('');
                      }}
                      className={`flex-1 py-3 rounded-[14px] border ${
                        hasMinimumSalonExperience === false
                          ? 'bg-textPrimary border-textPrimary'
                          : isDark
                            ? 'border-commonGradientStop7 bg-commonGradientStop6'
                            : 'border-[#DADADA] bg-[#F5F9F7]'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          hasMinimumSalonExperience === false
                            ? 'text-white'
                            : isDark
                              ? 'text-white'
                              : 'text-textDark'
                        }`}
                      >
                        No
                      </Text>
                    </Pressable>
                  </View>
                  {salonExperienceError ? (
                    <Text className="text-red-500 text-[12px] mt-2 ml-1">
                      {salonExperienceError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-3 mt-2">
                  <Text
                    className={`font-medium mb-3 text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
                  >
                    Smartphone & Internet Access
                    <Text className="text-red-500"> *</Text>
                  </Text>
                  <View className="flex-row gap-3 w-[100%] items-center justify-center ">
                    <Pressable
                      onPress={() => {
                        setIsTechCapable(true);
                        setTechCapabilityError('');
                      }}
                      className={`flex-1 py-3 rounded-[14px] border ${
                        isTechCapable === true
                          ? 'bg-textPrimary border-textPrimary'
                          : isDark
                            ? 'border-commonGradientStop7 bg-commonGradientStop6'
                            : 'border-[#DADADA] bg-[#F5F9F7]'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          isTechCapable === true
                            ? 'text-white'
                            : isDark
                              ? 'text-white'
                              : 'text-textDark'
                        }`}
                      >
                        Yes
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setIsTechCapable(false);
                        setTechCapabilityError('');
                      }}
                      className={`flex-1 py-3 rounded-[14px] border ${
                        isTechCapable === false
                          ? 'bg-textPrimary border-textPrimary'
                          : isDark
                            ? 'border-commonGradientStop7 bg-commonGradientStop6'
                            : 'border-[#DADADA] bg-[#F5F9F7]'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          isTechCapable === false
                            ? 'text-white'
                            : isDark
                              ? 'text-white'
                              : 'text-textDark'
                        }`}
                      >
                        No
                      </Text>
                    </Pressable>
                  </View>
                  {techCapabilityError ? (
                    <Text className="text-red-500 text-[12px] mt-2 ml-1">
                      {techCapabilityError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-5 mt-2">
                  <Text
                    className={`font-medium text-[14px] ${isDark ? 'text-[#ffff]' : 'text-black'} mb-2`}
                  >
                    Photo ID (Passport / Driver&apos;s Licence) (optional)
                  </Text>

                  <Pressable
                    onPress={pickPhotoIdDocument}
                    className={`border border-dashed ${
                      isDark
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
                      {photoIdFile ? photoIdFile.name : 'Upload your Photo ID'}
                    </Text>

                    <Text className="text-textMuted text-[12px] mt-1">
                      .jpg , .jpeg , .png , .pdf
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* Sign Up Button */}
            <View className="mt-6">
              <Button
                text="Create Account"
                variant="gradient"
                onPress={async () => {
                  // 1) Trigger react-hook-form validation for all inputs
                  const isFormValid = await trigger();

                  // 2) Validate custom Yes/No fields
                  let hasCustomError = false;

                  if (isConsultant && hasMinimumSalonExperience === null) {
                    setSalonExperienceError('Please confirm your salon experience.');
                    hasCustomError = true;
                  } else {
                    setSalonExperienceError('');
                  }

                  if (isConsultant && isTechCapable === null) {
                    setTechCapabilityError('Please confirm your tech capability.');
                    hasCustomError = true;
                  } else {
                    setTechCapabilityError('');
                  }

                  // 3) If any validation failed, do not submit
                  if (!isFormValid || hasCustomError) {
                    return;
                  }

                  // 4) All good: submit via react-hook-form
                  handleSubmit(handleSignup)();
                }}
                loading={loading}
                disabled={loading}
              />
            </View>

            {/* Sign in link */}
            <View className="text-center mt-3 mb-5 flex flex-row justify-center">
              <Text
                className={`text-center ${isDark ? 'text-textSecondary' : 'text-[#64748B]'} font-normal text-[14px]`}
              >
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('MainLogin')}>
                <Text className="text-textPrimary font-semibold">Sign In</Text>
              </Pressable>
            </View>
          </View>
        </GradientBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
