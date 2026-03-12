import React, { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTabletLayout } from '@/hooks/useTabletLayout';

export interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissOnBackdropPress?: boolean;
  containerClassName?: string;
  overlay?: ReactNode;
}

const MODAL_MAX_WIDTH_PHONE = 448;

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  visible,
  onClose,
  children,
  dismissOnBackdropPress = true,
  containerClassName = '',
  overlay,
}) => {
  const { isTablet, maxContentWidth } = useTabletLayout();
  const containerStyle = isTablet
    ? [styles.containerTablet, { maxWidth: maxContentWidth }]
    : styles.containerPhone;
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/70">
        <Pressable
          className="absolute inset-0"
          onPress={dismissOnBackdropPress ? onClose : undefined}
        />
        <View
          style={containerStyle}
          className={`rounded-md ${isTablet ? 'p-4' : 'p-6'} mx-4 ${containerClassName}`}
        >
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
  containerPhone: {
    width: '90%',
    maxWidth: MODAL_MAX_WIDTH_PHONE,
  },
  containerTablet: {
    width: '90%',
  },
});
