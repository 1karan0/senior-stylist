import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { ModalWrapper } from '@/common/components/ModalWrapper';
import LinearGradient from 'react-native-linear-gradient';

export interface DetailsModalProps {
  visible: boolean;
  onClose: () => void;
  request: {
    name: string;
    time: string;
    hasAttachment: boolean;
    requirements: string;
    checklist?: string[];
  };
}

const DetailsModal: React.FC<DetailsModalProps> = ({ visible, onClose, request }) => {
  const checklistItems = [
    'Lorem Ipsum dolor sit amet, consectetur adipiscing elit.',
    'Lorem Ipsum dolor sit amet, consectetur adipiscing elit.',
    'Lorem Ipsum dolor sit amet, consectetur adipiscing elit.',
  ];

  console.log('modal');

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      containerClassName="w-[95%] mx-4 p-2 cusor-pointer"
    >
      {/* Close Icon */}
      <TouchableOpacity className="absolute top-4 right-4 z-10" onPress={onClose}>
        <Image
          source={require('@/assets/icons/close.png')}
          className="w-5 h-5"
          resizeMode="contain"
        />
      </TouchableOpacity>

      <ScrollView className="pt-5">
        {/* Note Icon with Gradient at the start */}
        <View className="w-14 h-14 rounded-full items-center justify-center mr-3 overflow-hidden mb-2">
          <LinearGradient
            colors={['#27B07D', '#36D399']}
            className="w-full h-full items-center justify-center"
          >
            <Image
              source={require('@/assets/icons/note.png')}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </LinearGradient>
        </View>

        {/* Requirements Section */}
        <View className="mb-4">
          <Text className="text-lg font-poppins font-bold text-[#162721] mb-2">Requirements</Text>
          <Text className="text-[#658176] font-poppins leading-6">
            {request.requirements} {/* Using the actual requirements from the request */}
          </Text>

          {/* Checklist */}
          <View className="space-y-3 mt-3">
            {checklistItems.map((item, index) => (
              <View key={index} className="flex-row items-center">
                <Image
                  source={require('@/assets/icons/check.png')}
                  className="w-5 h-5 mr-2"
                  resizeMode="contain"
                />
                <Text className={`flex-1 text-[#658176] font-poppins`}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ModalWrapper>
  );
};

export default DetailsModal;
