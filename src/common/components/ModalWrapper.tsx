import React, { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

export interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissOnBackdropPress?: boolean;
  containerClassName?: string;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  visible,
  onClose,
  children,
  dismissOnBackdropPress = true,
  containerClassName = '',
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/80">
        <Pressable
          className="absolute inset-0"
          onPress={dismissOnBackdropPress ? onClose : undefined}
        />
        <View className={`rounded-md p-6 bg-white w-[90%] max-w-md mx-4 ${containerClassName}`}>
          {children}
        </View>
      </View>
    </Modal>
  );
};
