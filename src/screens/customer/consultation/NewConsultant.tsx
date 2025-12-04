import React, { use, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { createConsultation } from '@/api/user/consultation/useCreateConsultation';
import GradientBackground from '@/common/components/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import Toast from '@/common/components/Toast';
import { storage } from '@/services/storage';

const NEW_CONSULTATION_DRAFT_KEY = 'NEW_CONSULTATION_DRAFT';

const NewConsultant = ({ navigation }: any) => {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error' as any,
  });

  const { isDark } = useTheme();
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

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      });

      if (result.didCancel) return;

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
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

      if (!newId) {
        showToast('We could not open the chat automatically.', 'warning');
        return;
      }

      navigation.replace('FindingStylist', { consultationId: Number(newId) });
    } catch (err: any) {
      showToast(err?.message || 'Something went wrong', 'error');
      // Draft stays in storage for retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <GradientBackground className="flex-1 px-5 pt-6">
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />
        <ScrollView className="flex-1">
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
            className={` ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-gray-100'} rounded-md p-5 shadow border `}
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

            <TouchableOpacity
              onPress={pickImage}
              className="bg-[#DAE7E0] rounded-xl py-3 flex-row items-center justify-center"
            >
              <Image source={require('@/assets/icons/upload-2.png')} className="w-5 h-5 mr-2" />
              <Text className="text-textDark font-semibold">Upload reference photo</Text>
            </TouchableOpacity>

            {/* Show Preview */}
            {selectedImage && (
              <View className="mt-4 items-center">
                <Image
                  source={{ uri: selectedImage.uri }}
                  className="w-32 h-32 rounded-xl"
                  resizeMode="cover"
                />
              </View>
            )}

            <Text className={` ${isDark ? 'text-textSecondary' : 'text-gray-500'} mt-2 text-sm`}>
              Share a photo of your current style or inspiration
            </Text>

            {/* CTA Button */}
            <LinearGradient
              colors={['#2CCB91', '#23A76F']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 10 }}
              className="h-[50px] mt-6 rounded-xl justify-center items-center"
            >
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                className="flex-row items-center justify-center w-full h-full"
                disabled={loading}
              >
                <Image
                  source={require('@/assets/icons/white-search-icon.png')}
                  className="w-5 h-5 mr-2"
                />
                <Text className="text-white font-semibold text-base">
                  {loading ? 'Processing...' : 'Find Stylist'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </GradientBackground>
    </View>
  );
};

export default NewConsultant;
