import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/common/components/Button';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getInitials } from '@/utils/consultationUtils';

interface ConsultationDetails {
  id?: number;
  problem_description?: string;
  completed_at?: string;
  image_public_url?: string | null;
  stylistName?: string;
  stylistImageUrl?: string | null;
}

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  isLoading?: boolean;
  consultantName: string;
  consultationDetails?: ConsultationDetails | null;
  showConsultationDetails?: boolean; // Show details when opened from ChatHome
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  consultantName,
  consultationDetails,
  showConsultationDetails = false,
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
    if (!isLoading) {
      setRating(0);
      setReview('');
      onClose();
    }
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <SafeAreaView className="flex-1 bg-black/80 px-6">
        <StatusBar translucent backgroundColor="#000000D1" barStyle="light-content" />
        <KeyboardAvoidingView
          className="flex-1 px-6"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center">
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

                {/* Stylist Info - Show when consultation details are available */}
                {showConsultationDetails &&
                  consultationDetails &&
                  (consultationDetails.stylistName || consultationDetails.stylistImageUrl) && (
                    <View className="flex-row items-center mt-4 mb-3">
                      {consultationDetails.stylistImageUrl ? (
                        <Image
                          source={{ uri: consultationDetails.stylistImageUrl }}
                          className="w-12 h-12 rounded-full mr-3"
                        />
                      ) : (
                        <View className="w-12 h-12 rounded-full bg-buttonPrimaryBg items-center justify-center mr-3">
                          <Text className="text-white text-base font-semibold">
                            {getInitials(consultationDetails.stylistName || 'Stylist')}
                          </Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text
                          className={`text-sm font-poppins-regular mb-0.5 ${
                            isDark ? 'text-textSecondary' : 'text-textMuted'
                          }`}
                        >
                          Stylist
                        </Text>
                        <Text
                          className={`text-base font-poppins-semibold ${
                            isDark ? 'text-white' : 'text-black'
                          }`}
                        >
                          {consultationDetails.stylistName || 'Stylist'}
                        </Text>
                      </View>
                    </View>
                  )}

                {/* Consultation Details - Show when opened from ChatHome */}
                {showConsultationDetails && consultationDetails && (
                  <View
                    className={`mt-3 mb-3 p-3 rounded-xl border ${
                      isDark ? 'bg-[#11221D] border-[#1A2E28]' : 'bg-[#F5F5F5] border-[#E0E0E0]'
                    }`}
                  >
                    <View className="flex-row items-center mb-2">
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={isDark ? '#7F8A85' : '#A0A0A0'}
                      />
                      <Text
                        className={`text-xs font-poppins-semibold ml-2 ${
                          isDark ? 'text-textSecondary' : 'text-textMuted'
                        }`}
                      >
                        Consultation Details
                      </Text>
                    </View>
                    {consultationDetails.problem_description && (
                      <Text
                        className={`text-sm font-poppins-regular mb-2 ${
                          isDark ? 'text-white' : 'text-textDark'
                        }`}
                        numberOfLines={3}
                      >
                        {consultationDetails.problem_description}
                      </Text>
                    )}
                    {consultationDetails.completed_at && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color={isDark ? '#7F8A85' : '#A0A0A0'}
                        />
                        <Text
                          className={`text-xs font-poppins-regular ml-1 ${
                            isDark ? 'text-textSecondary' : 'text-textMuted'
                          }`}
                        >
                          Completed:{' '}
                          {new Date(consultationDetails.completed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

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
                      text="Submit "
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
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default RatingModal;
