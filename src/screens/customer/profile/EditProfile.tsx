import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';

import { useUploadProfilePicture } from '@/api/user/profile/useUploadProfilePicture';
import { useEditProfile } from '@/api/user/profile/useEditProfile';
import { Button } from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { ProfileUser } from '@/common/types';
import TextInputField from '@/common/components/TextInputField';
import ImagePickerModal from '@/common/components/modals/ImagePickerModal';
import ImageModal from '@/common/components/modals/ImageModal';
import { useTheme } from '@/contexts/ThemeContext';
import {
  requestCameraPermission,
  requestPhotoLibraryPermission,
  showPermissionDeniedAlert,
} from '@/utils/imagePermissions';
import { Platform } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const EditProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { profile } = route.params as { profile: ProfileUser };
  const { isDark } = useTheme();

  const queryClient = useQueryClient();
  const uploadMutation = useUploadProfilePicture();
  const editMutation = useEditProfile();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: profile.name,
      phone: profile.phone,
      address: profile.address ?? '',
      email: profile.email,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const [profilePic, setProfilePic] = React.useState(profile.profile_picture_url);
  const [showModal, setShowModal] = React.useState(false);
  const [showImagePreview, setShowImagePreview] = React.useState(false);
  const [showPasswordSection, setShowPasswordSection] = React.useState(false);

  // Optimize Image
  const optimizeImage = (asset: ImagePicker.Asset) => {
    if (!asset) return null;

    if (asset.base64) {
      return {
        uri: `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`,
        name: asset.fileName ?? `photo_${Date.now()}.jpg`,
        type: asset.type ?? 'image/jpeg',
      };
    }

    return {
      uri: asset.uri!,
      name: asset.fileName ?? `photo_${Date.now()}.jpg`,
      type: asset.type ?? 'image/jpeg',
    };
  };

  // Gallery
  const pickFromGallery = async () => {
    // Request permission before opening gallery
    const hasPermission = await requestPhotoLibraryPermission();
    if (!hasPermission && Platform.OS === 'android') {
      showPermissionDeniedAlert('photo');
      setShowModal(false);
      return;
    }

    const res = await ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 400,
      maxHeight: 400,
      selectionLimit: 1,
    });

    if (res.didCancel || !res.assets) {
      setShowModal(false);
      return;
    }

    // Handle permission errors
    if (res.errorCode === 'permission' || res.errorMessage?.toLowerCase().includes('permission')) {
      showPermissionDeniedAlert('photo');
      setShowModal(false);
      return;
    }

    const file = optimizeImage(res.assets[0]);
    if (!file) {
      setShowModal(false);
      return;
    }

    uploadMutation.mutate(file, {
      onSuccess: (res) => {
        setProfilePic(res.data.profile_picture_url);
      },
      onSettled: () => setShowModal(false),
    });
  };

  // Camera
  const takePhoto = async () => {
    // Request permission before opening camera
    const hasPermission = await requestCameraPermission();
    if (!hasPermission && Platform.OS === 'android') {
      showPermissionDeniedAlert('camera');
      setShowModal(false);
      return;
    }

    const res = await ImagePicker.launchCamera({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 400,
      maxHeight: 400,
      saveToPhotos: false,
    });

    if (res.didCancel || !res.assets) {
      setShowModal(false);
      return;
    }

    // Handle permission errors
    if (res.errorCode === 'permission' || res.errorMessage?.toLowerCase().includes('permission')) {
      showPermissionDeniedAlert('camera');
      setShowModal(false);
      return;
    }

    const file = optimizeImage(res.assets[0]);
    if (!file) {
      setShowModal(false);
      return;
    }

    uploadMutation.mutate(file, {
      onSuccess: (res) => {
        setProfilePic(res.data.profile_picture_url);
      },
      onSettled: () => setShowModal(false),
    });
  };

  const onSave = (values: any) => {
    const payload = {
      name: values.name,
      phone: values.phone,
      address: values.address,
      profile_picture_url: profilePic,
      ...(values.newPassword && { password: values.newPassword }),
    };

    editMutation.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['profileData'] });
        navigation.goBack();
      },
    });
  };

  return (
    <GradientBackground>
      <View className="flex-1 px-5 pt-6 pb-20">
        {/* Header */}
        <View className={`mb-4 pb-4`}>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image
                source={
                  isDark
                    ? require('@/assets/icons/green-back.png')
                    : require('@/assets/icons/back.png')
                }
                style={{
                  width: 20,
                  height: 20,
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Edit Profile
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Pic */}
          <View className="items-center mb-10">
            <View style={{ position: 'relative' }}>
              {/* Profile Pic Container */}
              <TouchableOpacity
                onPress={() => {
                  if (profilePic) {
                    setShowImagePreview(true);
                  }
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#27B07D', '#36D399']}
                  style={{ borderRadius: 100 }}
                  className="w-32 h-32 items-center justify-center"
                >
                  <View className="w-32 h-32 rounded-full overflow-hidden">
                    {profilePic ? (
                      <Image source={{ uri: profilePic }} className="w-full h-full" />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Text className="text-white text-4xl font-bold">
                          {profile.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* The PLUS button - make it a real touchable */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                activeOpacity={0.7}
                className={`absolute bottom-0 right-0 bg-green-600 w-10 h-10 rounded-full 
                items-center justify-center border-2 border-white `}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text className={`mt-4 text-sm ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}>
              Tap to change profile picture
            </Text>
          </View>

          {/* FORM */}
          <View
            className={`${
              isDark ? 'bg-[#11211c] border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'
            } rounded-2xl p-4 border flex-col gap-3`}
          >
            <TextInputField
              label="FULL NAME"
              value={watch('name')}
              onChangeText={(t) => setValue('name', t)}
            />

            <TextInputField
              label="PHONE NUMBER"
              keyboardType="phone-pad"
              value={watch('phone')}
              onChangeText={(t) => setValue('phone', t)}
            />

            {/* Email */}
            <View className="">
              <Text
                className={`text-sm mb-2 font-poppins-medium ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                EMAIL
              </Text>
              <View
                className={`border rounded-xl px-4 py-3 ${isDark ? 'bg-[#0A1410] border-commonGradientStop7' : 'bg-[#e4e4e4] border-[#DAE7E0]'}`}
              >
                <Text
                  className={`font-poppins-regular ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                >
                  {profile.email}
                </Text>
              </View>
            </View>
          </View>

          {/* Change Password Section - Instagram Style */}
          <View
            className={`${
              isDark ? 'bg-[#11211c] border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'
            } rounded-2xl border mt-5 overflow-hidden`}
          >
            <TouchableOpacity
              onPress={() => setShowPasswordSection(!showPasswordSection)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <Text
                className={`text-base font-urbanist-semibold ${
                  isDark ? 'text-white' : 'text-textDark'
                }`}
              >
                Change Password
              </Text>
              <Image
                source={
                  isDark
                    ? require('@/assets/icons/green-back.png')
                    : require('@/assets/icons/back.png')
                }
                style={{
                  width: 16,
                  height: 16,
                  transform: [{ rotate: showPasswordSection ? '90deg' : '-90deg' }],
                }}
              />
            </TouchableOpacity>

            {showPasswordSection && (
              <View
                className="px-4 pb-4 border-t"
                style={{ borderTopColor: isDark ? '#1a3a2e' : '#DAE7E0' }}
              >
                <View className="pt-4 gap-3">
                  <Controller
                    control={control}
                    name="newPassword"
                    rules={{
                      validate: (value) => {
                        if (value && value.length < 6)
                          return 'Password must be at least 6 characters';
                        return true;
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <TextInputField
                        label="NEW PASSWORD"
                        placeholder="Enter new password"
                        value={value || ''}
                        onChangeText={onChange}
                        isPassword={true}
                        error={errors.newPassword?.message as string}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="confirmPassword"
                    rules={{
                      validate: (value, formValues) => {
                        if (formValues.newPassword && !value) return 'Please confirm your password';
                        if (formValues.newPassword && value !== formValues.newPassword)
                          return 'Passwords do not match';
                        return true;
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <TextInputField
                        label="CONFIRM NEW PASSWORD"
                        placeholder="Confirm new password"
                        value={value || ''}
                        onChangeText={onChange}
                        isPassword={true}
                        error={errors.confirmPassword?.message as string}
                      />
                    )}
                  />
                </View>
              </View>
            )}
          </View>

          <View className="mt-6">
            <Button
              loading={editMutation.isPending}
              text="Save Changes"
              onPress={handleSubmit(onSave)}
              variant="gradient"
            />
          </View>

          <View className="mt-4">
            <Button
              text="Cancel"
              variant="light"
              onPress={() => navigation.goBack()}
              className="rounded-[14px]"
            />
          </View>
        </ScrollView>
        {/* Image Picker Modal */}
        <ImagePickerModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onCamera={takePhoto}
          onGallery={pickFromGallery}
          loading={uploadMutation.isPending}
        />
        {/* Image Preview Modal */}
        <ImageModal
          visible={showImagePreview}
          imageUri={profilePic || null}
          onClose={() => setShowImagePreview(false)}
          rounded={true}
        />
      </View>
    </GradientBackground>
  );
};

export default EditProfile;
