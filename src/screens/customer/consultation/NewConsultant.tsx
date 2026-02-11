import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useForm, Controller } from 'react-hook-form';

import { createConsultation } from '@/api/user/consultation/useCreateConsultation';
import GradientBackground from '@/common/components/GradientBackground';
import Toast from '@/common/components/Toast';
import Button from '@/common/components/Button';
import ImagePickerModal from '@/common/components/modals/ImagePickerModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAds } from '@/contexts/AdContext';
import { storage } from '@/services/storage';

import {
  requestPhotoLibraryPermission,
  requestCameraPermission,
  showPermissionDeniedAlert,
} from '@/utils/imagePermissions';
import { useFindingStylistModal } from '@/contexts/FindingStylistModalContext';
import { useTabletLayout } from '@/hooks/useTabletLayout';
const NewConsultant = ({ navigation }: any) => {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error' as any,
  });

  const { isDark } = useTheme();
  const { isAdsEnabled, preloadAd } = useAds();
  const { open: openFindingStylistModal } = useFindingStylistModal();
  const { horizontalPadding } = useTabletLayout();
  // Preload ad when component mounts (so it's ready when user taps "Find Stylist")
  useEffect(() => {
    if (isAdsEnabled) {
      preloadAd('small').catch((err) => {
        console.error('[NewConsultant] Failed to preload ad:', err);
      });
    }
  }, [isAdsEnabled, preloadAd]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const { control, handleSubmit } = useForm({
    defaultValues: {
      description: '',
    },
  });

  const handleImagePickerResult = (asset: any) => {
    if (!asset) return;

    // Prefer base64 data URI like chat does
    if (asset.base64) {
      const mimeType = asset.type || 'image/jpeg';
      setSelectedImage({
        ...asset,
        uri: `data:${mimeType};base64,${asset.base64}`,
      });
    } else if (asset.uri) {
      setSelectedImage(asset);
    }
  };

  const takePhoto = async () => {
    try {
      setShowImagePickerModal(false);
      // Request permission before opening camera
      const hasPermission = await requestCameraPermission();
      if (!hasPermission && Platform.OS === 'android') {
        showPermissionDeniedAlert('camera');
        return;
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        includeBase64: true,
      });

      if (result.didCancel) return;

      // Handle permission errors
      if (
        result.errorCode === 'permission' ||
        result.errorMessage?.toLowerCase().includes('permission')
      ) {
        showPermissionDeniedAlert('camera');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        handleImagePickerResult(result.assets[0]);
      }
    } catch (err) {
      console.log('Camera error:', err);
    }
  };

  const pickFromGallery = async () => {
    try {
      setShowImagePickerModal(false);
      // Request permission before opening gallery
      const hasPermission = await requestPhotoLibraryPermission();
      if (!hasPermission && Platform.OS === 'android') {
        showPermissionDeniedAlert('photo');
        return;
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      });

      if (result.didCancel) return;

      // Handle permission errors
      if (
        result.errorCode === 'permission' ||
        result.errorMessage?.toLowerCase().includes('permission')
      ) {
        showPermissionDeniedAlert('photo');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        handleImagePickerResult(result.assets[0]);
      }
    } catch (err) {
      console.log('Image pick error:', err);
    }
  };

  const onSubmit = async (data: any) => {
    if (!data.description.trim()) {
      showToast('Please enter your styling requirement.', 'error');
      return;
    }

    const draft = {
      description: data.description.trim(),
      selectedImage,
      savedAt: Date.now(),
    };

    try {
      setLoading(true);

      // Save draft using your new helper
      await storage.setConsultationDraft(draft);

      // Proceed with API call
      const response = await createConsultation(draft.description, draft.selectedImage);

      const newId =
        response?.data?.consultation?.id ??
        response?.consultation?.id ??
        response?.data?.id ??
        response?.id;

      if (!newId || !Number.isFinite(Number(newId))) {
        showToast('We could not open the chat automatically.', 'warning');
        return;
      }

      const consultationId = Number(newId);
      if (consultationId <= 0) {
        showToast('Invalid consultation ID. Please try again.', 'error');
        return;
      }

      openFindingStylistModal(consultationId);
    } catch (err: any) {
      showToast(err?.message || 'Something went wrong', 'error');
      // Draft stays in storage for retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <GradientBackground className="flex-1 pb-10">
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            className="flex-1 pt-6 "
            style={[{ paddingHorizontal: horizontalPadding }]}
            contentContainerStyle={{ paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="flex-row items-center mb-5">
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Image
                  source={
                    isDark
                      ? require('@/assets/icons/green-back.png')
                      : require('@/assets/icons/back.png')
                  }
                  className="w-6 h-6"
                />
              </TouchableOpacity>
              <Text
                className={`text-[22px] ${isDark ? 'text-white' : 'text-textDark'} font-semibold ml-3`}
              >
                New Consultation
              </Text>
            </View>

            <Text className={` ${isDark ? 'text-textSecondary' : 'text-gray-500'} -mt-3 mb-4`}>
              Tell us about your styling needs
            </Text>

            {/* Card */}
            <View
              className={` ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-gray-100'} rounded-md p-5 border `}
            >
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} `}>
                Describe Your Requirements
              </Text>

              <Text className={` ${isDark ? 'text-textSecondary' : 'text-gray-500'} mt-3 mb-2`}>
                What styling help do you need? *
              </Text>

              {/* RHF Controller */}
              <Controller
                name="description"
                control={control}
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <View
                    className={`border rounded-xl  ${isDark ? 'bg-commonGradientStop6 border-commonGradientStop7' : 'bg-[#FAFAFA] border-[#E6E6E6]'}  p-3`}
                  >
                    <TextInput
                      placeholder="Describe your fashion style preferences, occasion, or special requirements..."
                      multiline
                      numberOfLines={8}
                      value={value}
                      onChangeText={onChange}
                      className={` ${isDark ? 'text-white' : 'text-black'} `}
                      placeholderTextColor={isDark ? '#8AA897' : '#9AA0A6'}
                    />
                  </View>
                )}
              />

              {/* Upload Image */}
              <Text className={` ${isDark ? 'text-textSecondary' : 'text-gray-500'} mt-5 mb-2`}>
                Upload Photo (Optional)
              </Text>

              <Button
                text="Upload reference photo"
                variant="light"
                onPress={() => setShowImagePickerModal(true)}
                icon={
                  <Image
                    source={require('@/assets/icons/upload-2.png')}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                }
                className="rounded-[14px]"
              />

              {/* Show Preview */}
              {selectedImage && (
                <View
                  className={`mt-4 items-center overflow-hidden border ${isDark ? 'border-commonGradientStop7' : 'border-[#DADADA]'} rounded-xl`}
                >
                  <Image
                    source={{ uri: selectedImage.uri }}
                    className="w-full h-52 rounded-xl"
                    resizeMode="contain"
                  />
                </View>
              )}

              <Text className={` ${isDark ? 'text-textSecondary' : 'text-gray-500'} mt-2 text-sm`}>
                Share a photo of your current style or inspiration
              </Text>

              {/* CTA Button */}
              <View className="mt-6">
                <Button
                  text={loading ? 'Processing...' : 'Find Stylist'}
                  variant="gradient"
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                  disabled={loading}
                  icon={
                    <Image
                      source={require('@/assets/icons/white-search-icon.png')}
                      style={{ width: 20, height: 20 }}
                      resizeMode="contain"
                    />
                  }
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Image Picker Modal */}
        <ImagePickerModal
          visible={showImagePickerModal}
          onClose={() => setShowImagePickerModal(false)}
          onCamera={takePhoto}
          onGallery={pickFromGallery}
          title="Choose Reference Photo"
        />
      </GradientBackground>
    </View>
  );
};

export default NewConsultant;
