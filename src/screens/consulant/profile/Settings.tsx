import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '@/common/components/GradientBackground';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import DeleteAccountModal from '@/common/components/modals/DeleteAccountModal';

const Settings: React.FC = () => {
  const { isDark, setTheme } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    // Implement delete account logic here
    setShowDeleteModal(false);
    // After deletion, logout and navigate to auth screen
    logout();
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 py-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleBack} className="mr-3">
              <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#162721'} />
            </TouchableOpacity>
            <Text
              className={`text-2xl font-urbanist-bold ${isDark ? 'text-white' : 'text-textDark'}`}
            >
              Settings
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }}
        >
          {/* Theme Section */}
          <View
            className={`rounded-xl border p-5 mb-4 shadow-sm ${
              isDark
                ? 'bg-buttonSecondaryText border-commonGradientStop7'
                : 'bg-white border-[#DAE7E0]'
            }`}
          >
            <Text
              className={`text-lg font-urbanist-semibold mb-4 ${
                isDark ? 'text-white' : 'text-textDark'
              }`}
            >
              Appearance
            </Text>

            {/* Theme Toggle */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    isDark ? 'bg-commonGradientStop7' : 'bg-[#F5F9F7]'
                  }`}
                >
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color="#27B07D" />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-urbanist-semibold text-base ${
                      isDark ? 'text-white' : 'text-textDark'
                    }`}
                  >
                    Dark Mode
                  </Text>
                  <Text
                    className={`text-sm font-poppins-regular mt-1 ${
                      isDark ? 'text-textSecondary' : 'text-textMuted'
                    }`}
                  >
                    {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                  </Text>
                </View>
              </View>

              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={'#ffffff'}
              />
            </View>
          </View>

          {/* Account Section */}
          <View
            className={`rounded-xl border p-5 mb-4 shadow-sm ${
              isDark
                ? 'bg-buttonSecondaryText border-commonGradientStop7'
                : 'bg-white border-[#DAE7E0]'
            }`}
          >
            <Text
              className={`text-lg font-urbanist-semibold mb-4 ${
                isDark ? 'text-white' : 'text-textDark'
              }`}
            >
              Account
            </Text>

            {/* Delete Account */}
            <TouchableOpacity
              onPress={handleDeleteAccount}
              className={`flex-row items-center justify-between p-4 rounded-xl ${
                isDark ? 'bg-[#0F1F1A]' : 'bg-[#F5F9F7]'
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-red-500/10 rounded-full items-center justify-center mr-3">
                  <Ionicons name="trash-outline" size={20} color="#F22D2D" />
                </View>
                <View className="flex-1">
                  <Text className="text-error font-urbanist-semibold text-base">
                    Delete Account
                  </Text>
                  <Text
                    className={`text-sm font-poppins-regular mt-1 ${
                      isDark ? 'text-textSecondary' : 'text-textMuted'
                    }`}
                  >
                    Permanently delete your account
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View
            className={`rounded-xl border p-5 mb-8 shadow-sm ${
              isDark
                ? 'bg-buttonSecondaryText border-commonGradientStop7'
                : 'bg-white border-[#DAE7E0]'
            }`}
          >
            <Text
              className={`text-lg font-urbanist-semibold mb-4 ${
                isDark ? 'text-white' : 'text-textDark'
              }`}
            >
              About
            </Text>

            <View className="space-y-3">
              {/* Version */}
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className={`font-poppins-regular ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                >
                  Version
                </Text>
                <Text
                  className={`font-urbanist-semibold ${isDark ? 'text-white' : 'text-textDark'}`}
                >
                  1.0.0
                </Text>
              </View>

              {/* Terms & Conditions */}
              <TouchableOpacity
                className="flex-row items-center justify-between"
                activeOpacity={0.7}
              >
                <Text
                  className={`font-poppins-regular ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                >
                  Terms & Conditions
                </Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#8AA897' : '#658176'} />
              </TouchableOpacity>

              {/* Privacy Policy */}
              <TouchableOpacity
                className="flex-row items-center justify-between mt-3"
                activeOpacity={0.7}
              >
                <Text
                  className={`font-poppins-regular ${isDark ? 'text-textSecondary' : 'text-textMuted'}`}
                >
                  Privacy Policy
                </Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#8AA897' : '#658176'} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Delete Account Confirmation Modal */}
        <DeleteAccountModal
          visible={showDeleteModal}
          isDark={isDark}
          onConfirm={confirmDeleteAccount}
          onCancel={cancelDelete}
        />
      </View>
    </GradientBackground>
  );
};

export default Settings;
