import React from 'react';
import { Modal, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/common/components/Button';
import Ionicons from '@react-native-vector-icons/ionicons';

interface FinishConsultationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const FinishConsultationModal: React.FC<FinishConsultationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { isDark } = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade">
      <StatusBar translucent backgroundColor="#000000D1" barStyle="light-content" />
      <View className="flex-1 justify-center items-center bg-black/80">
        <View
          className={`${isDark ? 'bg-[#0D1A16]' : 'bg-white'} rounded-md px-5 py-7 w-[90%]`}
          style={{ position: 'relative' }}
        >
          {/* Close Icon */}
          <TouchableOpacity
            onPress={() => {
              if (!isLoading) {
                onClose();
              }
            }}
            disabled={isLoading}
            activeOpacity={0.6}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            style={{
              position: 'absolute',
              right: 16,
              top: 16,
              zIndex: 10,
              padding: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          {/* Title */}
          <Text
            className={`text-start text-lg font-poppins-semibold mb-2 pr-10 ${
              isDark ? 'text-white' : 'text-black'
            }`}
            style={{ paddingTop: 4 }}
          >
            End Consultation
          </Text>

          {/* Description */}
          <Text
            className={`text-start w-[70%] font-poppins-regular text-sm mb-6 ${
              isDark ? 'text-textSecondary' : 'text-textMuted'
            }`}
          >
            Are you sure you want to end your consultation with Charlene Jacks? You'll be able to
            leave a review after finishing.
          </Text>

          {/* Buttons */}
          <View className="flex-row gap-3">
            {/* Cancel Button */}
            <View className="flex-1">
              <Button
                text="Cancel"
                variant="light"
                onPress={onClose}
                disabled={isLoading}
                className="rounded-[14px] bg-[#F5F9F7]"
              />
            </View>

            {/* Finish Button */}
            <View className="flex-1">
              <Button
                text={isLoading ? 'Finishing...' : 'Finish'}
                variant="gradient"
                onPress={onConfirm}
                loading={isLoading}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FinishConsultationModal;
