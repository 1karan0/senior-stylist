import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Ionicons from '@react-native-vector-icons/ionicons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  loading?: boolean;
}

const ImagePickerModal = ({ visible, onClose, onCamera, onGallery, loading = false }: Props) => {
  const { isDark } = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1" />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <View className={`px-6 pt-4 pb-10 rounded-t-3xl ${isDark ? 'bg-[#0D1A16]' : 'bg-white'}`}>
          {/* Drag handle */}
          <View className="w-16 h-1.5 bg-white/40 rounded-full self-center mb-5" />

          <Text
            className={`text-center text-lg font-urbanist-bold mb-6 ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            Choose Profile Photo
          </Text>

          {/* Camera Button */}
          <TouchableOpacity
            onPress={onCamera}
            activeOpacity={0.8}
            disabled={loading}
            className={`flex-row items-center px-6 py-4 mb-3 rounded-xl ${
              isDark ? 'bg-[#123427]' : 'bg-[#E4F6ED]'
            } ${loading ? 'opacity-60' : ''}`}
          >
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                isDark ? 'bg-[#1A4738]' : 'bg-[#C6EEDD]'
              }`}
            >
              <View className="w-12 h-12 bg-buttonPrimaryBg rounded-full items-center justify-center mr-4">
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text
              className={`text-base font-urbanist-semibold ${isDark ? 'text-white' : 'text-black'}`}
            >
              Take Photo
            </Text>
          </TouchableOpacity>

          {/* Gallery Button */}
          <TouchableOpacity
            onPress={onGallery}
            activeOpacity={0.8}
            disabled={loading}
            className={`flex-row items-center px-6 py-4 rounded-xl mb-4 ${
              isDark ? 'bg-[#123427]' : 'bg-[#E4F6ED]'
            } ${loading ? 'opacity-60' : ''}`}
          >
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                isDark ? 'bg-[#1A4738]' : 'bg-[#C6EEDD]'
              }`}
            >
              <View className="w-12 h-12 bg-buttonPrimaryBg rounded-full items-center justify-center mr-4">
                <Ionicons name="images" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text
              className={`text-base font-urbanist-semibold ${isDark ? 'text-white' : 'text-black'}`}
            >
              Choose from Gallery
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Text
              className={`text-center text-base font-urbanist-semibold mt-2 ${
                isDark ? 'text-textSecondary' : 'text-textMuted'
              }`}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          {loading && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="absolute inset-0 bg-black/30" />
              <ActivityIndicator size="large" color="#27B07D" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ImagePickerModal;
