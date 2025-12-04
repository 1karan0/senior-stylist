import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';

import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';

import { ProfileUser } from '@/common/types';
import TextInputField from '@/common/components/TextInputField';

import { useUploadProfilePicture } from '@/api/user/profile/useUploadProfilePicture';
import { useEditProfile } from '@/api/user/profile/useEditProfile';
import { Button } from '@/common/components/Button';

import ImagePickerModal from '@/common/components/modals/ImagePickerModal';

const EditProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { profile } = route.params as { profile: ProfileUser };
  const { isDark } = useTheme();

  const queryClient = useQueryClient();
  const uploadMutation = useUploadProfilePicture();
  const editMutation = useEditProfile();

  const { control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      name: profile.name,
      phone: profile.phone,
      address: profile.address ?? '',
      email: profile.email,
    },
  });

  const [profilePic, setProfilePic] = React.useState(profile.profile_picture_url);
  const [showModal, setShowModal] = React.useState(false);

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
    const res = await ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 400,
      maxHeight: 400,
      selectionLimit: 1,
    });

    if (res.didCancel || !res.assets) return;

    const file = optimizeImage(res.assets[0]);
    if (!file) return;

    uploadMutation.mutate(file, {
      onSuccess: (res) => {
        setProfilePic(res.data.profile_picture_url);
        setShowModal(false);
      },
    });
  };

  // Camera
  const takePhoto = async () => {
    const res = await ImagePicker.launchCamera({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 400,
      maxHeight: 400,
      saveToPhotos: false,
    });

    if (res.didCancel || !res.assets) return;

    const file = optimizeImage(res.assets[0]);
    if (!file) return;

    uploadMutation.mutate(file, {
      onSuccess: (res) => {
        setProfilePic(res.data.profile_picture_url);
        setShowModal(false);
      },
    });
  };

  const onSave = (values: any) => {
    const payload = {
      ...values,
      profile_picture_url: profilePic,
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
        <View
          className={`mb-4 pb-4 border-b ${isDark ? 'border-commonGradientStop7' : 'border-[#DAE7E0]'}`}
        >
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image
                source={
                  isDark
                    ? require('@/assets/icons/green-back.png')
                    : require('@/assets/icons/back.png')
                }
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
            <View>
              {/* Profile Pic Container */}
              <TouchableOpacity
                onPress={() => {
                  console.log('pressed!');
                  setShowModal(true);
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
                onPress={() => {
                  console.log('pressed!', showModal);
                  setShowModal(true);
                }}
                activeOpacity={0.7}
                className="absolute bottom-0 right-0 bg-green-600 w-10 h-10 rounded-full 
                items-center justify-center border-4 border-white dark:border-[#11211c]"
              >
                <Text className="text-white text-xl">+</Text>
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
            } rounded-2xl p-4 border`}
          >
            <TextInputField
              label="full name"
              value={watch('name')}
              onChangeText={(t) => setValue('name', t)}
            />

            <TextInputField
              label="phone number"
              keyboardType="phone-pad"
              value={watch('phone')}
              onChangeText={(t) => setValue('phone', t)}
            />

            {/* Email */}
            <View className="mb-4">
              <Text
                className={`text-sm mb-2 font-poppins-medium ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                email
              </Text>
              <TextInput
                value={profile.email}
                editable={false}
                className={`rounded-xl py-4 px-4 text-base font-urbanist-medium ${
                  isDark ? 'text-white bg-[#0E1915]' : 'text-black bg-[#F2F7F4]'
                }`}
              />
            </View>

            <TextInputField
              label="address"
              multiline
              value={watch('address')}
              onChangeText={(t) => setValue('address', t)}
            />
          </View>

          <View className="mt-8">
            {editMutation.isPending ? (
              <Button text="Saving..." disabled variant="gradient" />
            ) : (
              <Button text="Save Changes" onPress={handleSubmit(onSave)} variant="gradient" />
            )}
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 p-4">
            <Text
              className={`text-center text-base font-urbanist-semibold ${
                isDark ? 'text-textSecondary' : 'text-textMuted'
              }`}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {/* The new modal */}
        <ImagePickerModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onCamera={takePhoto}
          onGallery={pickFromGallery}
        />
      </View>
    </GradientBackground>
  );
};

export default EditProfile;
