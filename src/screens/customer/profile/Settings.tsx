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
  const { theme, isDark, setTheme } = useTheme(); // ← now we use "theme" + "isDark"
  const { paddingBottom } = useTabBarSafePadding();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleBack = () => navigation.goBack();

  const handleDeleteAccount = () => setShowDeleteModal(true);

  const confirmDeleteAccount = () => {
    setShowDeleteModal(false);
    logout();
  };

  const cancelDelete = () => setShowDeleteModal(false);

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
          {/* Appearance Section */}
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

            {/* THEME OPTIONS */}
            <View className="space-y-4">
              {/* Light Mode */}
              <TouchableOpacity
                onPress={() => setTheme('light')}
                className={`flex-row items-center justify-between p-4 rounded-xl ${
                  isDark ? 'bg-[#0F1F1A]' : 'bg-[#F5F9F7]'
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      isDark ? 'bg-commonGradientStop7' : 'bg-[#F5F9F7]'
                    }`}
                  >
                    <Ionicons name="sunny" size={20} color="#27B07D" />
                  </View>
                  <Text
                    className={`font-urbanist-semibold text-base ${
                      isDark ? 'text-white' : 'text-textDark'
                    }`}
                  >
                    Light
                  </Text>
                </View>

                {theme === 'light' && (
                  <Ionicons name="checkmark-circle" size={22} color="#27B07D" />
                )}
              </TouchableOpacity>

              {/* Dark Mode */}
              <TouchableOpacity
                onPress={() => setTheme('dark')}
                className={`flex-row items-center justify-between p-4 rounded-xl ${
                  isDark ? 'bg-[#0F1F1A]' : 'bg-[#F5F9F7]'
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      isDark ? 'bg-commonGradientStop7' : 'bg-[#F5F9F7]'
                    }`}
                  >
                    <Ionicons name="moon" size={20} color="#27B07D" />
                  </View>
                  <Text
                    className={`font-urbanist-semibold text-base ${
                      isDark ? 'text-white' : 'text-textDark'
                    }`}
                  >
                    Dark
                  </Text>
                </View>

                {theme === 'dark' && <Ionicons name="checkmark-circle" size={22} color="#27B07D" />}
              </TouchableOpacity>

              {/* System Mode */}
              <TouchableOpacity
                onPress={() => setTheme('system')}
                className={`flex-row items-center justify-between p-4 rounded-xl ${
                  isDark ? 'bg-[#0F1F1A]' : 'bg-[#F5F9F7]'
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      isDark ? 'bg-commonGradientStop7' : 'bg-[#F5F9F7]'
                    }`}
                  >
                    <Ionicons name="phone-portrait-outline" size={20} color="#27B07D" />
                  </View>
                  <Text
                    className={`font-urbanist-semibold text-base ${
                      isDark ? 'text-white' : 'text-textDark'
                    }`}
                  >
                    System
                  </Text>
                </View>

                {theme === 'system' && (
                  <Ionicons name="checkmark-circle" size={22} color="#27B07D" />
                )}
              </TouchableOpacity>
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

          {/* About Section */}
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

        {/* Delete Account Modal */}
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
