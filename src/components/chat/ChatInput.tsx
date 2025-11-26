import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';

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
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {selectedImage ? (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close-circle" size={24} color="#FF4433" />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.iconButton, disabled && styles.iconButtonDisabled]}
          onPress={handleAttachmentPress}
          disabled={disabled}
        >
          <Ionicons name="attach-outline" size={24} color={disabled ? '#666' : '#A1A09A'} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor="#A1A09A"
          multiline
          maxLength={2000}
          editable={!disabled}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            ((!message.trim() && !selectedImage) || disabled) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={(!message.trim() && !selectedImage) || disabled}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0E1B16',
    borderTopWidth: 1,
    borderTopColor: '#152821',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  imagePreview: {
    marginBottom: 8,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#0E1B16',
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152821',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#0E1B16',
    minHeight: 44,
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  sendButton: {
    backgroundColor: '#27B07D',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatInput;
