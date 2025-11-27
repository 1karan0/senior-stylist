import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { useTheme } from '@/contexts/ThemeContext';

interface ChatInputProps {
  onSend: (message: string, imageUri?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type message here...',
}) => {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { isDark } = useTheme();

  const handleSend = () => {
    if ((!message.trim() && !selectedImage) || disabled) {
      return;
    }

    const text = message.trim();
    const image = selectedImage || undefined;
    setMessage('');
    setSelectedImage(null);
    onSend(text, image);
  };

  const handlePickerResult = (asset?: Asset) => {
    if (!asset) {
      return;
    }

    // Prefer base64 data URL when available – this is more reliable to upload
    // across different React Native environments than file:// or content:// URIs.
    if (asset.base64) {
      const mimeType = asset.type || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${asset.base64}`;
      setSelectedImage(dataUrl);
      return;
    }

    if (asset.uri) {
      setSelectedImage(asset.uri);
    }
  };

  const pickFromLibrary = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
      includeBase64: true,
    });
    handlePickerResult(result.assets?.[0]);
  };

  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: false,
      includeBase64: true,
    });
    handlePickerResult(result.assets?.[0]);
  };

  const handleAttachmentPress = () => {
    if (disabled) {
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) takePhoto();
          if (index === 2) pickFromLibrary();
        }
      );
    } else {
      Alert.alert('Add attachment', 'Choose an option', [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View
      className="px-4 pt-2"
      style={{
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      {selectedImage ? (
        <View className="mb-3 relative">
          <Image source={{ uri: selectedImage }} className="w-[100px] h-[100px] rounded-xl" />
          <TouchableOpacity
            className="absolute -top-2 -right-2 bg-white rounded-full shadow"
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={26} color="#FF4433" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* MAIN INPUT BOX */}
      <View
        className={`flex-row items-center  ${isDark ? 'bg-[#0E1B16]' : 'bg-white'} rounded-[28px] px-4 min-h-[50px]`}
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* ATTACH ICON */}
        <TouchableOpacity
          className={`p-2 mr-1 ${disabled ? 'opacity-50' : ''}`}
          onPress={handleAttachmentPress}
          disabled={disabled}
        >
          <Ionicons name="attach-outline" size={24} color="#6C6C6C" />
        </TouchableOpacity>

        {/* INPUT */}
        <TextInput
          className={`flex-1 ${isDark ? 'text-white' : 'text-black'} text-[15px] max-h-[100px] py-2`}
          style={{
            textAlignVertical: 'center',
            includeFontPadding: false,
          }}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor="#A1A1A1"
          multiline
          maxLength={2000}
          editable={!disabled}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        {/* SEND BUTTON (MINT FLOATING BUBBLE) */}
        <TouchableOpacity
          className={`w-10 h-10 rounded-full justify-center items-center ml-2 ${
            (!message.trim() && !selectedImage) || disabled ? 'opacity-40' : ''
          }`}
          onPress={handleSend}
          disabled={(!message.trim() && !selectedImage) || disabled}
          style={{
            backgroundColor: '#21C17A',
            shadowColor: '#21C17A',
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Image source={require('@/assets/icons/send.png')} className="mt-1 mr-0.5" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatInput;
