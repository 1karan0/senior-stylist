import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useCreateDispute } from '@/api/user/dispute/useCreateDispute';
import Button from '@/common/components/Button';
import GradientBackground from '@/common/components/GradientBackground';
import { ProfileStackParamList } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
import Ionicons from '@react-native-vector-icons/ionicons';

type SubmitDisputeNavigationProp = StackNavigationProp<ProfileStackParamList, 'SubmitDispute'>;
type SubmitDisputeRouteProp = RouteProp<ProfileStackParamList, 'SubmitDispute'>;

interface Props {
  navigation: SubmitDisputeNavigationProp;
  route: SubmitDisputeRouteProp;
}

const MIN_DESCRIPTION_LENGTH = 20;

const SubmitDispute: React.FC<Props> = ({ navigation, route }) => {
  const { isDark } = useTheme();
  const { consultationId } = route.params;
  const { mutate: createDispute, isPending: isCreating } = useCreateDispute();
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSubmitClick = () => {
    // Clear previous errors
    setError('');

    // Validate description
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setError(`Minimum ${MIN_DESCRIPTION_LENGTH} characters required`);
      return;
    }

    // Show review modal
    setShowReviewModal(true);
  };

  const handleReviewModalClose = () => {
    if (!isCreating) {
      setShowReviewModal(false);
    }
  };

  const handleReviewSubmit = () => {
    // Create dispute
    createDispute(
      {
        consultation_id: consultationId.toString(),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setShowReviewModal(false);
          setShowSuccessModal(true);
        },
        onError: (error: any) => {
          setShowReviewModal(false);
          console.log(error);
          Alert.alert('Error', error.message || 'Failed to submit dispute. Please try again.');
        },
      }
    );
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate('ProfileHome');
  };

  const characterCount = description.length;
  const isValid = characterCount >= MIN_DESCRIPTION_LENGTH;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <GradientBackground topOverlayColor="#27B07D">
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />

        {/* Header Section with Green Background */}
        <View className="px-6 pt-10 pb-5 bg-buttonPrimaryBg rounded-b-2xl">
          <Text className="text-white text-2xl font-urbanist-bold mb-2">Submit a Request</Text>
          <Text className="text-white  font-poppins-regular opacity-90">
            Report an issue with your consultation
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-6 pb-24">
            {/* Step 2 Section */}
            <View className="mb-6">
              <Text
                className={`text-base font-poppins-semibold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
              >
                Step 2: Describe Your Issue
              </Text>
              <Text
                className={` font-poppins-regular  ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
              >
                Please provide details about the issue you experienced
              </Text>
            </View>

            {/* Describe the Issue Label */}
            <Text
              className={`font-poppins-semibold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Describe the Issue
            </Text>

            {/* Text Input Field */}
            <View
              className={`rounded-xl p-4 mb-2 border ${
                error
                  ? 'border-red-500'
                  : isDark
                    ? 'bg-buttonSecondaryText border-commonGradientStop7'
                    : 'bg-[#F5F9F7] border-[#DAE7E0]'
              }`}
            >
              <TextInput
                className={`min-h-[120px] text-base ${isDark ? 'text-white' : 'text-textDark'}`}
                placeholder="Please provide a detailed description of the issue you experienced. Include any relevant information that will help us understand and resolve your dispute..."
                placeholderTextColor={isDark ? '#8AA897' : '#94A3B8'}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setError('');
                }}
                multiline
                textAlignVertical="top"
                style={{
                  includeFontPadding: false,
                }}
              />
            </View>

            {/* Character Count and Minimum Requirement */}
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className={`text-sm font-urbanist-regular ${
                  isValid ? 'text-[#27B07D]' : isDark ? 'text-textSecondary' : 'text-textMuted'
                }`}
              >
                Minimum {MIN_DESCRIPTION_LENGTH} characters required
              </Text>
              <Text
                className={`text-sm font-urbanist-regular ${
                  isValid ? 'text-[#27B07D]' : isDark ? 'text-textSecondary' : 'text-textMuted'
                }`}
              >
                {characterCount}/{MIN_DESCRIPTION_LENGTH}
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <Text className="text-red-500 text-sm font-urbanist-regular mb-4">{error}</Text>
            ) : null}

            {/* Important Note (Yellow Box) */}
            <View className="rounded-xl p-4 mb-6 bg-[#FFF3CD] border border-[#DAE7E0] flex-row items-center justify-between gap-2">
              <View className=" ">
                <Image
                  source={require('@/assets/icons/warn.png')}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-urbanist-medium text-[#856404]">
                  <Text className="font-urbanist-bold">Important:</Text> Please be as detailed as
                  possible. Our admin team will review your dispute and respond within 24-48 hours.
                  False or misleading disputes may result in account restrictions.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Button
                  text="Back"
                  onPress={handleBack}
                  variant="light"
                  className={`${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} border rounded-xl`}
                  textClassName={isDark ? 'text-white' : 'text-textDark'}
                />
              </View>
              <View className="flex-1">
                <Button
                  text="Submit Dispute"
                  onPress={handleSubmitClick}
                  variant="gradient"
                  disabled={!isValid}
                  className="rounded-xl"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Review Submission Modal */}
        <Modal
          transparent
          visible={showReviewModal}
          animationType="fade"
          onRequestClose={handleReviewModalClose}
        >
          <StatusBar translucent backgroundColor="#000000D1" barStyle="light-content" />
          <View className="flex-1 justify-center items-center bg-black/80">
            <View
              className={`${isDark ? 'bg-[#0D1A16]' : 'bg-white'} rounded-xl px-5 py-7 w-[90%]`}
              style={{ position: 'relative' }}
            >
              {/* Close Icon */}
              <TouchableOpacity
                onPress={handleReviewModalClose}
                disabled={isCreating}
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
                  isDark ? 'text-white' : 'text-textDark'
                }`}
                style={{ paddingTop: 4 }}
              >
                Review Submission
              </Text>

              {/* Description */}
              <Text
                className={`text-start font-poppins-regular text-sm mb-6 ${
                  isDark ? 'text-textSecondary' : 'text-textMuted'
                }`}
              >
                Are you sure you want to submit this dispute? You can add more details after
                submission.
              </Text>

              {/* Buttons */}
              <View className="flex-row gap-3">
                {/* Cancel Button */}
                <View className="flex-1">
                  <Button
                    text="Cancel"
                    variant="light"
                    onPress={handleReviewModalClose}
                    disabled={isCreating}
                    className={`rounded-xl ${
                      isDark
                        ? 'bg-buttonSecondaryText border-commonGradientStop7'
                        : 'bg-white border-[#27B07D]'
                    } border`}
                    textClassName={isDark ? 'text-white' : 'text-[#27B07D]'}
                  />
                </View>

                {/* Submit Button */}
                <View className="flex-1">
                  <Button
                    text={isCreating ? 'Submitting...' : 'Submit'}
                    variant="gradient"
                    onPress={handleReviewSubmit}
                    loading={isCreating}
                    disabled={isCreating}
                    className="rounded-xl"
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          transparent
          visible={showSuccessModal}
          animationType="fade"
          onRequestClose={handleSuccessModalClose}
        >
          <StatusBar translucent backgroundColor="#000000D1" barStyle="light-content" />
          <View className="flex-1 justify-center items-center bg-black/80 px-6">
            <View
              className={`${isDark ? 'bg-[#0D1A16]' : 'bg-white'} rounded-2xl px-6 py-7 w-full`}
              style={{ position: 'relative' }}
            >
              {/* Close Icon */}
              <TouchableOpacity
                onPress={handleSuccessModalClose}
                activeOpacity={0.6}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  zIndex: 10,
                  padding: 8,
                }}
              >
                <Ionicons name="close" size={22} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>

              {/* Title */}
              <Text
                className={`text-start text-xl font-poppins-semibold mb-3 mt-2 pr-10 ${
                  isDark ? 'text-white' : 'text-textDark'
                }`}
              >
                Dispute Submitted
              </Text>

              {/* Description */}
              <Text
                className={`text-start font-poppins-regular text-sm mb-6 ${
                  isDark ? 'text-textSecondary' : 'text-textMuted'
                }`}
              >
                Dispute submitted successfully! You will receive a response within 24-48 hours.
              </Text>

              {/* OK Button */}
              <View className="w-[50%]">
                <Button
                  text="OK"
                  variant="gradient"
                  onPress={handleSuccessModalClose}
                  className="rounded-xl"
                />
              </View>
            </View>
          </View>
        </Modal>
      </GradientBackground>
    </KeyboardAvoidingView>
  );
};

export default SubmitDispute;
