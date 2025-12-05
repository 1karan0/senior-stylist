import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/common/components/Button';
import Ionicons from '@react-native-vector-icons/ionicons';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  isLoading?: boolean;
  consultantName: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  consultantName,
}) => {
  const { isDark } = useTheme();
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');

  const handleStarPress = (index: number) => {
    setRating(index + 1);
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, review);
    setRating(0);
    setReview('');
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <StatusBar translucent backgroundColor="#000000D1" barStyle="light-content" />
      <View className="flex-1 justify-center items-center bg-black/80 px-6">
        <View className={`${isDark ? 'bg-[#0D1A16]' : 'bg-white'} w-full rounded-2xl p-6`}>
          {/* Close Icon */}
          <TouchableOpacity
            onPress={handleClose}
            disabled={isLoading}
            className="absolute right-4 top-4"
          >
            <Ionicons name="close" size={22} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>

          {/* Title */}
          <Text
            className={`text-start text-xl font-poppins-semibold mt-2 ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            Rate Your Consultation
          </Text>

          {/* Subtitle */}
          <Text
            className={`text-start font-poppins-regular text-sm mt-2 ${
              isDark ? 'text-textSecondary' : 'text-textMuted'
            }`}
          >
            How was your experience with {consultantName}?
          </Text>

          {/* Stars */}
          <View className="flex-row justify-start mt-5 mb-4">
            {[0, 1, 2, 3, 4].map((index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleStarPress(index)}
                disabled={isLoading}
                className="mx-1"
              >
                <Ionicons
                  name={index < rating ? 'star' : 'star-outline'}
                  size={20}
                  color={index < rating ? '#FFB800' : '#D3D3D3'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Review input */}
          <TextInput
            placeholder="Share your experience (optional)..."
            placeholderTextColor={isDark ? '#7F8A85' : '#A0A0A0'}
            multiline
            value={review}
            onChangeText={setReview}
            className={`w-full h-28 rounded-xl px-4 py-3 text-sm ${
              isDark ? 'bg-[#11221D] text-white' : 'bg-[#E6E6E6] text-black'
            }`}
          />

          {/* Buttons */}
          <View className="flex-row gap-3 mt-6">
            <View className="flex-1">
              <Button
                text="Skip"
                variant="light"
                onPress={handleClose}
                disabled={isLoading}
                className="rounded-xl"
              />
            </View>

            <View className="flex-1">
              <Button
                text="Submit Review"
                variant="gradient"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading || rating === 0}
                className="rounded-xl"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RatingModal;
