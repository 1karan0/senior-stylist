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
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/40"
        onPress={dismissOnBackdropPress ? onClose : undefined}
        disabled={!dismissOnBackdropPress}
      />

      {/* Modal Container */}
      <View
        className={`
          absolute top-1/2 left-1/2 w-80 
          -translate-x-1/2 -translate-y-1/2
          rounded-2xl p-6 bg-white
          ${containerClassName}
        `}
      >
        {children}
      </View>
    </Modal>
  );
};
