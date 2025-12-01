import React, { useState } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';

const EditProfile: React.FC = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [formData, setFormData] = useState({
    name: 'John Doe',
    phoneNumber: '+1 (555) 123-4567',
    email: 'john.doe@example.com',
    password: '',
  });

  const handleImagePicker = (type: 'camera' | 'gallery') => {
    setShowImageModal(false);

    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      maxWidth: 500,
      maxHeight: 500,
    };

    const callback = (response: any) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }
      if (response.assets && response.assets[0]) {
        setProfileImage(response.assets[0].uri);
      }
    };

    if (type === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  const handleSaveChanges = () => {
    // Implement save logic here
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    // Reset form or navigate back
    Alert.alert('Cancelled', 'Changes discarded');
  };

  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 py-6">
          <View className="flex-row items-center">
            <TouchableOpacity className="mr-3">
              <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#162721'} />
            </TouchableOpacity>
            <Text
              className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-[#162721]'}`}
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
            <TouchableOpacity onPress={() => setShowImageModal(true)} activeOpacity={0.8}>
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
                    <Text className="text-white font-urbanist-semibold text-4xl">JD</Text>
                  </LinearGradient>
                )}
              </View>

              {/* Plus Button */}
              <View className="absolute bottom-0 right-0 w-10 h-10 bg-[#27B07D] rounded-full items-center justify-center border-4 border-white shadow-lg">
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text
              className={`mt-3 text-sm font-poppins-regular ${
                isDark ? 'text-[#8AA897]' : 'text-[#658176]'
              }`}
            >
              Tap to change profile picture
            </Text>
          </View>

          {/* Form Card */}
          <View
            className={`rounded-2xl border p-6 mb-6 shadow-sm ${
              isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DAE7E0]'
            }`}
          >
            {/* Full Name */}
            <View className="mb-5">
              <Text
                className={`text-xs font-urbanist-semibold mb-2 uppercase ${
                  isDark ? 'text-[#8AA897]' : 'text-[#658176]'
                }`}
              >
                Full Name
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                className={`border rounded-xl px-4 py-3 font-poppins-regular ${
                  isDark
                    ? 'bg-[#0F1F1A] border-[#273F36] text-white'
                    : 'bg-white border-[#DAE7E0] text-[#162721]'
                }`}
                placeholderTextColor={isDark ? '#8AA897' : '#658176'}
              />
            </View>

            {/* Phone Number */}
            <View className="mb-5">
              <Text
                className={`text-xs font-urbanist-semibold mb-2 uppercase ${
                  isDark ? 'text-[#8AA897]' : 'text-[#658176]'
                }`}
              >
                Phone Number
              </Text>
              <TextInput
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                keyboardType="phone-pad"
                className={`border rounded-xl px-4 py-3 font-poppins-regular ${
                  isDark
                    ? 'bg-[#0F1F1A] border-[#273F36] text-white'
                    : 'bg-white border-[#DAE7E0] text-[#162721]'
                }`}
                placeholderTextColor={isDark ? '#8AA897' : '#658176'}
              />
            </View>

            {/* Email (Disabled) */}
            <View className="mb-5">
              <Text
                className={`text-xs font-urbanist-semibold mb-2 uppercase ${
                  isDark ? 'text-[#8AA897]' : 'text-[#658176]'
                }`}
              >
                Email
              </Text>
              <View
                className={`border rounded-xl px-4 py-3 ${
                  isDark ? 'bg-[#0A1410] border-[#273F36]' : 'bg-[#F5F9F7] border-[#DAE7E0]'
                }`}
              >
                <Text
                  className={`font-poppins-regular ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'}`}
                >
                  {formData.email}
                </Text>
              </View>
            </View>

            {/* Password */}
            <View className="mb-2">
              <Text
                className={`text-xs font-urbanist-semibold mb-2 uppercase ${
                  isDark ? 'text-[#8AA897]' : 'text-[#658176]'
                }`}
              >
                Password
              </Text>
              <TextInput
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                placeholder="Enter new password"
                className={`border rounded-xl px-4 py-3 font-poppins-regular ${
                  isDark
                    ? 'bg-[#0F1F1A] border-[#273F36] text-white'
                    : 'bg-white border-[#DAE7E0] text-[#162721]'
                }`}
                placeholderTextColor={isDark ? '#8AA897' : '#658176'}
              />
            </View>
          </View>

          {/* Save Changes Button */}
          <TouchableOpacity onPress={handleSaveChanges} activeOpacity={0.8}>
            <LinearGradient colors={['#27B07D', '#36D399']} className="rounded-xl py-4 mb-4">
              <Text className="text-white text-center font-urbanist-bold text-base">
                Save Changes
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={handleCancel}
            className={`border rounded-xl py-4 mb-8 ${
              isDark ? 'border-[#273F36] bg-transparent' : 'border-[#DAE7E0] bg-white'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-center font-urbanist-bold text-base ${
                isDark ? 'text-white' : 'text-[#162721]'
              }`}
            >
              Cancel
            </Text>
          </TouchableOpacity>
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
            <Pressable className={`rounded-t-3xl p-6 ${isDark ? 'bg-[#162721]' : 'bg-white'}`}>
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />

              <Text
                className={`text-xl font-urbanist-bold mb-6 text-center ${
                  isDark ? 'text-white' : 'text-[#162721]'
                }`}
              >
                Choose Profile Photo
              </Text>

              {/* Camera Option */}
              <TouchableOpacity
                onPress={() => handleImagePicker('camera')}
                className={`flex-row items-center p-4 rounded-xl mb-3 ${
                  isDark ? 'bg-[#0F1F1A]' : 'bg-[#F5F9F7]'
                }`}
              >
                <View className="w-12 h-12 bg-[#27B07D] rounded-full items-center justify-center mr-4">
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
                <Text
                  className={`text-base font-urbanist-semibold ${
                    isDark ? 'text-white' : 'text-[#162721]'
                  }`}
                >
                  Take Photo
                </Text>
              </TouchableOpacity>

              {/* Gallery Option */}
              <TouchableOpacity
                onPress={() => handleImagePicker('gallery')}
                className={`flex-row items-center p-4 rounded-xl mb-3 ${
                  isDark ? 'bg-[#0F1F1A]' : 'bg-[#F5F9F7]'
                }`}
              >
                <View className="w-12 h-12 bg-[#27B07D] rounded-full items-center justify-center mr-4">
                  <Ionicons name="images" size={24} color="#FFFFFF" />
                </View>
                <Text
                  className={`text-base font-urbanist-semibold ${
                    isDark ? 'text-white' : 'text-[#162721]'
                  }`}
                >
                  Choose from Gallery
                </Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity onPress={() => setShowImageModal(false)} className="mt-4 p-4">
                <Text
                  className={`text-center font-urbanist-semibold ${
                    isDark ? 'text-[#8AA897]' : 'text-[#658176]'
                  }`}
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
