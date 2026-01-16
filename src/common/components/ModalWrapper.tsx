import React, { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

export interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissOnBackdropPress?: boolean;
  containerClassName?: string;
  overlay?: ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  visible,
  onClose,
  children,
  dismissOnBackdropPress = true,
  containerClassName = '',
  overlay,
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
        {overlay ? (
          <View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, styles.overlay]}>
            {overlay}
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
    elevation: 9999,
  },
});
