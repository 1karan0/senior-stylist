import React from 'react';
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

interface ImageModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const ImageModal: React.FC<ImageModalProps> = ({ visible, imageUri, onClose }) => {
  if (!imageUri) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  image: {
    width: width - 40,
    height: height - 100,
  },
});

export default ImageModal;
