import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import GradientBackground from '@/common/components/GradientBackground';
import Button from '@/common/components/Button';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';

import { useUploadProfilePicture } from '@/api/user/profile/useUploadProfilePicture';
import { useEditProfile } from '@/api/user/profile/useEditProfile';
import { useGetProfile } from '@/api/user/profile/useGetProfile';
import {
  requestCameraPermission,
  requestPhotoLibraryPermission,
  showPermissionDeniedAlert,
} from '@/utils/imagePermissions';

const EditProfile: React.FC = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // fetch current user
  const { data: profileData, isLoading: profileLoading } = useGetProfile();
  const user = profileData?.user as any;

  // local state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    address: '',
  });

  // mutations
  const uploadMutation = useUploadProfilePicture();
  const editProfileMutation = useEditProfile();

  // reflect fetched profile into local state when available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? '',
        phoneNumber: user.phone ?? '',
        email: user.email ?? '',
        password: '',
        address: user.address ?? '',
      });
      setProfileImage(user.profile_picture_url ?? null);
    }
  }, [user]);

  const handleImagePicker = async (type: 'camera' | 'gallery') => {
    setShowImageModal(false);

    // Request permission before opening picker
    let hasPermission = false;
    if (type === 'camera') {
      hasPermission = await requestCameraPermission();
    } else {
      hasPermission = await requestPhotoLibraryPermission();
    }

    // If permission denied, show alert (on Android; iOS handles it automatically)
    if (!hasPermission && Platform.OS === 'android') {
      showPermissionDeniedAlert(type === 'camera' ? 'camera' : 'photo');
      return;
    }

    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      maxWidth: 1200,
      maxHeight: 1200,
    };

    const callback = (response: any) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        // Handle permission errors
        if (
          response.errorCode === 'permission' ||
          response.errorMessage?.toLowerCase().includes('permission')
        ) {
          showPermissionDeniedAlert(type === 'camera' ? 'camera' : 'photo');
          return;
        }
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const uri = asset.uri;
        const fileName = asset.fileName ?? `photo_${Date.now()}.jpg`;
        const mimeType = asset.type ?? 'image/jpeg';

        // temporary preview
        setProfileImage(uri ?? null);

        const file = { uri, name: fileName, type: mimeType } as any;

        uploadMutation.mutate(file, {
          onSuccess: (res) => {
            const hostedUrl = res?.data?.profile_picture_url ?? res?.profile_picture_url;
            if (hostedUrl) {
              setProfileImage(hostedUrl);
            } else {
              Alert.alert('Upload', 'Image uploaded but server did not return URL.');
            }
          },
          onError: (err: any) => {
            console.error('Upload failed', err);
            Alert.alert('Upload failed', err?.message ?? 'Please try again');
          },
        });
      }
    };

    if (type === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  const handleSaveChanges = () => {
    // basic validation
    if (!formData.name || formData.name.trim().length === 0) {
      Alert.alert('Validation', 'Please enter your name.');
      return;
    }

    const payload = {
      name: formData.name,
      address: formData.address ?? '',
      profile_picture_url: profileImage ?? '',
      phone: formData.phoneNumber,
    };

    editProfileMutation.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['profileData'] });
        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      },
      onError: (err: any) => {
        console.error('Edit profile failed', err);
        Alert.alert('Error', err?.message ?? 'Failed to update profile. Try again.');
      },
    });
  };

  const handleCancel = () => {
    Alert.alert('Discard Changes', 'Are you sure you want to discard changes?', [
      { text: 'No' },
      { text: 'Yes', onPress: () => navigation.goBack() },
    ]);
  };

  // react-query v5 status flags
  const isUploading = uploadMutation.isPending;
  const isSaving = editProfileMutation.isPending;

  // while fetching profile, we can show a simple loader
  if (profileLoading) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#27B07D" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 py-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#162721'} />
            </TouchableOpacity>
            <Text
              className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Edit Profile
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }}
        >
          {/* Profile Image Section */}
          <View className="items-center mb-8">
            <TouchableOpacity
              onPress={() => setShowImageModal(true)}
              activeOpacity={0.8}
              disabled={isUploading || isSaving}
            >
              <View className="w-32 h-32 rounded-full overflow-hidden">
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={['#27B07D', '#36D399']}
                    style={{ flex: 1 }}
                    className="items-center justify-center"
                  >
                    <Text className="text-white font-urbanist-semibold text-4xl">
                      {formData.name?.charAt(0) ?? 'J'}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              {/* Plus Button */}
              <View className="absolute bottom-0 right-0 w-10 h-10 bg-buttonPrimaryBg rounded-full items-center justify-center border-4 border-white shadow-lg">
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            <Text
              className={`mt-3 text-sm font-poppins-regular ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
            >
              Tap to change profile picture
            </Text>
          </View>

          {/* Form Card */}
          <View
            className={`rounded-2xl border p-6 mb-6 shadow-sm ${
              isDark
                ? 'bg-buttonSecondaryText border-commonGradientStop7'
                : 'bg-white border-[#DAE7E0]'
            }`}
          >
            {/* Full Name */}
            <View className="mb-5">
              <Text
                className={`text-xs font-urbanist-semibold mb-2 uppercase ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
              >
                Full Name
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                className={`border rounded-xl px-4 py-3 font-poppins-regular ${
                  isDark
                    ? 'bg-[#0F1F1A] border-commonGradientStop7 text-white'
                    : 'bg-white border-[#DAE7E0] text-textDark'
                }`}
                placeholderTextColor={isDark ? '#8AA897' : '#658176'}
                editable={!isSaving}
              />
            </View>

            {/* Phone Number */}
            <View className="mb-5">
              <Text
                className={`text-xs font-urbanist-semibold mb-2 uppercase ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
              >
                Phone Number
              </Text>
              <TextInput
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                keyboardType="phone-pad"
                className={`border rounded-xl px-4 py-3 font-poppins-regular ${
                  isDark
                    ? 'bg-[#0F1F1A] border-commonGradientStop7 text-white'
                    : 'bg-white border-[#DAE7E0] text-textDark'
                }`}
                placeholderTextColor={isDark ? '#8AA897' : '#658176'}
                editable={!isSaving}
              />
            </View>

            {/* Email (Disabled) */}
            <View className="mb-5">
              <Text
                className={`text-xs font-urbanist-semibold mb-2 uppercase ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
              >
                Email
              </Text>
              <View
                className={`border rounded-xl px-4 py-3 ${isDark ? 'bg-[#0A1410] border-commonGradientStop7' : 'bg-[#F5F9F7] border-[#DAE7E0]'}`}
              >
                <Text
                  className={`font-poppins-regular ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                >
                  {formData.email}
                </Text>
              </View>
            </View>

            {/* Change Password */}
            <View className="mb-2">
              <Text
                className={`text-xs font-urbanist-semibold mb-2 uppercase ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
              >
                Change Password
              </Text>
              <TextInput
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                placeholder="Enter new password"
                className={`border rounded-xl px-4 py-3 font-poppins-regular ${
                  isDark
                    ? 'bg-[#0F1F1A] border-commonGradientStop7 text-white'
                    : 'bg-white border-[#DAE7E0] text-textDark'
                }`}
                placeholderTextColor={isDark ? '#8AA897' : '#658176'}
                editable={!isSaving}
              />
            </View>
          </View>

          {/* Save Changes Button */}
          <View className="mb-4">
            <Button
              text="Save Changes"
              onPress={handleSaveChanges}
              disabled={isUploading || isSaving}
              loading={isSaving}
              variant="gradient"
              className="rounded-xl py-4"
            />
          </View>

          {/* Cancel Button */}
          <View className="mb-8">
            <Button
              text="Cancel"
              onPress={handleCancel}
              disabled={isUploading || isSaving}
              variant="light"
              className={`border rounded-xl py-4 ${isDark ? 'border-commonGradientStop7 bg-transparent' : 'border-[#DAE7E0] bg-white'}`}
              textClassName={isDark ? 'text-white' : 'text-textDark'}
            />
          </View>
        </ScrollView>

        {/* Image Picker Modal */}
        <Modal
          visible={showImageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowImageModal(false)}
          >
            <Pressable
              className={`rounded-t-3xl p-6 ${isDark ? 'bg-buttonSecondaryText' : 'bg-white'}`}
            >
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />

              <Text
                className={`text-xl font-urbanist-bold mb-6 text-center ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                Choose Profile Photo
              </Text>

              {/* Camera Option */}
              <TouchableOpacity
                onPress={() => handleImagePicker('camera')}
                className={`flex-row items-center p-4 rounded-xl mb-3 ${isDark ? 'bg-[#0F1F1A]' : 'bg-[#F5F9F7]'}`}
              >
                <View className="w-12 h-12 bg-buttonPrimaryBg rounded-full items-center justify-center mr-4">
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
                <Text
                  className={`text-base font-urbanist-semibold ${isDark ? 'text-white' : 'text-textDark'}`}
                >
                  Take Photo
                </Text>
              </TouchableOpacity>

              {/* Gallery Option */}
              <TouchableOpacity
                onPress={() => handleImagePicker('gallery')}
                className={`flex-row items-center p-4 rounded-xl mb-3 ${isDark ? 'bg-[#0F1F1A]' : 'bg-[#F5F9F7]'}`}
              >
                <View className="w-12 h-12 bg-buttonPrimaryBg rounded-full items-center justify-center mr-4">
                  <Ionicons name="images" size={24} color="#FFFFFF" />
                </View>
                <Text
                  className={`text-base font-urbanist-semibold ${isDark ? 'text-white' : 'text-textDark'}`}
                >
                  Choose from Gallery
                </Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity onPress={() => setShowImageModal(false)} className="mt-4 p-4">
                <Text
                  className={`text-center font-urbanist-semibold ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </GradientBackground>
  );
};

export default EditProfile;
