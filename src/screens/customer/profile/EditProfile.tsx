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

import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';

import { ProfileUser } from '@/common/types';
import TextInputField from '@/common/components/TextInputField';

import { useUploadProfilePicture } from '@/api/user/profile/useUploadProfilePicture';
import { useEditProfile } from '@/api/user/profile/useEditProfile';

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
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: profile.name,
      phone: profile.phone,
      address: profile.address || '',
      email: profile.email, // read-only field
    },
  });

  const [profilePic, setProfilePic] = React.useState(profile.profile_picture_url);

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      if (response.didCancel || !response.assets) return;

      const file = {
        uri: response.assets[0].uri,
        name: response.assets[0].fileName,
        type: response.assets[0].type,
      };

      uploadMutation.mutate(file as any, {
        onSuccess: (res) => {
          setProfilePic(res.data.profile_picture_url);
        },
      });
    });
  };

  const onSave = (values: any) => {
    const payload: any = { ...values };
    payload.profile_picture_url = profilePic;

    editMutation.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['profileData'] });
        navigation.goBack();
      },
    });
  };

  return (
    <GradientBackground>
      <View className="flex-1 px-5 pt-6">
        {/* Header */}
        <View className={` pb-4 border-b ${isDark ? 'border-[#273F36]' : 'border-[#DAE7E0]'}`}>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-1">
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
          {/* PROFILE PIC */}
          <View className="items-center mb-10">
            <TouchableOpacity
              onPress={handleImagePick}
              activeOpacity={0.8}
              disabled={uploadMutation.isPending}
            >
              <View>
                {/* Loader overlay */}
                {uploadMutation.isPending && (
                  <View className="absolute inset-0 bg-black/50 rounded-full z-10 items-center justify-center">
                    <ActivityIndicator color="#fff" size="large" />
                  </View>
                )}

                {/* Avatar */}
                {profilePic ? (
                  <Image
                    source={{ uri: profilePic }}
                    className="w-32 h-32 rounded-full bg-green-600 border-4 border-green-600/20"
                  />
                ) : (
                  <View className="w-32 h-32 rounded-full bg-green-600 items-center justify-center border-4 border-green-600/20">
                    <Text className="text-white text-4xl font-bold">{profile.name.charAt(0)}</Text>
                  </View>
                )}

                {/* Plus icon */}
                <View className="absolute bottom-0 right-0 bg-green-600 w-10 h-10 rounded-full items-center justify-center border-4 border-white dark:border-[#11211c]">
                  <Text className="text-white text-xl">+</Text>
                </View>
              </View>
            </TouchableOpacity>

            <Text className={`mt-4 text-sm ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}>
              Tap to change profile picture
            </Text>
          </View>

          {/* FORM CARD (rounded container like image) */}
          <View
            className={` ${isDark ? 'bg-[#11211c] border-[#273F36]' : 'bg-white border-[#DAE7E0]'} rounded-2xl p-4 border`}
          >
            {/* FULL NAME */}
            <TextInputField
              label="FULL NAME"
              value={profile.name}
              onChangeText={(t) => setValue('name', t)}
            />

            {/* PHONE */}
            <TextInputField
              label="PHONE NUMBER"
              keyboardType="phone-pad"
              value={profile.phone}
              onChangeText={(t) => setValue('phone', t)}
            />

            {/* EMAIL INPUT (simple TextInput, readonly) */}
            <View className="mb-4">
              <Text
                className={`text-xs mb-2 font-urbanist-semibold ${
                  isDark ? 'text-[#8AA897]' : 'text-[#658176]'
                }`}
              >
                EMAIL
              </Text>

              <TextInput
                value={profile.email}
                editable={false}
                className={`rounded-xl py-4 px-4 text-base font-urbanist-medium ${
                  isDark ? 'text-white bg-[#0E1915]' : 'text-black bg-[#F2F7F4]'
                }`}
              />
            </View>

            {/* ADDRESS */}
            <TextInputField
              label="ADDRESS"
              multiline
              value={profile?.address || ''}
              onChangeText={(t) => setValue('address', t)}
            />
          </View>
          {/* SAVE BUTTON */}
          <TouchableOpacity
            onPress={handleSubmit(onSave)}
            disabled={editMutation.isPending}
            className={`mt-8 bg-green-600 p-3 rounded-2xl ${
              editMutation.isPending ? 'opacity-60' : ''
            }`}
          >
            {editMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-white text-lg font-urbanist-bold">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>

          {/* CANCEL */}
          <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 p-4">
            <Text
              className={`text-center text-base font-urbanist-semibold ${
                isDark ? 'text-[#8AA897]' : 'text-[#658176]'
              }`}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default EditProfile;
