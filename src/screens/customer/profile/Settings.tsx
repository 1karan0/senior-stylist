import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Platform, Linking } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';

import { useDeleteAccount } from '@/api/auth/useDeletAccount';
import GradientBackground from '@/common/components/GradientBackground';
import DeleteAccountModal from '@/common/components/modals/DeleteAccountModal';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Toast from '@/common/components/Toast';
import { useTabletLayout } from '@/hooks/useTabletLayout';
const Settings: React.FC = () => {
  const { theme, isDark, setTheme } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();
  const navigation = useNavigation();
  const { logout } = useAuth();
  const deleteAccountMutation = useDeleteAccount();
  const { horizontalPadding } = useTabletLayout();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as any,
  });

  useEffect(() => {
    const version = DeviceInfo.getVersion();
    setAppVersion(version);
  }, []);

  // ---- THEME LOGIC FIXED ---- //

  // DARK MODE SWITCH
  const toggleDarkMode = () => {
    if (theme === 'system') {
      // override system → go dark
      setTheme('dark');
    } else {
      setTheme(isDark ? 'light' : 'dark');
    }
  };

  // SYSTEM MODE SWITCH
  const toggleSystemMode = (value: boolean) => {
    if (value) {
      setTheme('system');
    } else {
      // fallback to current applied theme
      setTheme(isDark ? 'dark' : 'light');
    }
  };

  // SYSTEM SWITCH VALUE
  const systemSwitchValue = theme === 'system';

  // DARK SWITCH VALUE
  const darkSwitchValue = isDark; // reflects actual applied theme

  const handleBack = () => navigation.goBack();
  const handleDeleteAccount = () => setShowDeleteModal(true);

  const handleOpenTerms = async () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
        : 'https://senior-stylist.com/terms-conditions';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        setToast({
          visible: true,
          message: 'Unable to open the link. Please try again later.',
          type: 'error' as any,
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Failed to open the link. Please try again later.',
        type: 'error' as any,
      });
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    const url = 'https://senior-stylist.com/privacy-policy';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        setToast({
          visible: true,
          message: 'Unable to open the link. Please try again later.',
          type: 'error' as any,
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Failed to open the link. Please try again later.',
        type: 'error' as any,
      });
    }
  };

  const handleContactUs = async () => {
    const url = 'https://senior-stylist.com/contact';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        setToast({
          visible: true,
          message: 'Unable to open the link. Please try again later.',
          type: 'error' as any,
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Failed to open the link. Please try again later.',
        type: 'error' as any,
      });
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      setShowDeleteModal(false);
      await logout();
      setToast({
        visible: true,
        message: 'Your account has been deleted successfully.',
        type: 'success' as any,
      });
    } catch (error: any) {
      const message = error?.message || 'Failed to delete account. Please try again.';
      setToast({
        visible: true,
        message,
        type: 'error' as any,
      });
    }
  };

  return (
    <GradientBackground>
      <View className="flex-1">
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />
        {/* Header */}
        <View className="py-6" style={[{ paddingHorizontal: horizontalPadding }]}>
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
          className="flex-1"
          style={[{ paddingHorizontal: horizontalPadding }]}
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

            {/* Dark Mode Toggle */}
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
                    {theme === 'system'
                      ? 'Managed by system'
                      : isDark
                        ? 'Dark theme enabled'
                        : 'Light theme enabled'}
                  </Text>
                </View>
              </View>

              <View style={{ width: Platform.OS === 'ios' ? 51 : undefined }}>
                <Switch
                  value={darkSwitchValue}
                  disabled={theme === 'system'} // disable when system mode is on
                  onValueChange={toggleDarkMode}
                  trackColor={{
                    false: '#d1d5db',
                    true: `${theme === 'system' ? '#ffffff' : '#10b981'}`,
                  }}
                  thumbColor={theme === 'system' ? '#9ca3af' : '#ffffff'}
                />
              </View>
            </View>

            {/* System Mode Toggle */}
            <View className="flex-row mt-5 items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    isDark ? 'bg-commonGradientStop7' : 'bg-[#F5F9F7]'
                  }`}
                >
                  <Ionicons name="phone-portrait-outline" size={20} color="#27B07D" />
                </View>

                <View className="flex-1">
                  <Text
                    className={`font-urbanist-semibold text-base ${
                      isDark ? 'text-white' : 'text-textDark'
                    }`}
                  >
                    System Mode
                  </Text>
                  <Text
                    className={`text-sm font-poppins-regular mt-1 ${
                      isDark ? 'text-textSecondary' : 'text-textMuted'
                    }`}
                  >
                    {theme === 'system' ? 'Following device theme' : 'Using manual theme'}
                  </Text>
                </View>
              </View>

              <View style={{ width: Platform.OS === 'ios' ? 51 : undefined }}>
                <Switch
                  value={systemSwitchValue}
                  onValueChange={toggleSystemMode}
                  trackColor={{ false: '#d1d5db', true: '#10b981' }}
                  thumbColor={'#ffffff'}
                />
              </View>
            </View>
          </View>

          {/* About Section */}
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
              About
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className={`font-poppins-regular ${
                    isDark ? 'text-textSecondary' : 'text-textMuted'
                  }`}
                >
                  Version
                </Text>
                <Text
                  className={`font-urbanist-semibold ${isDark ? 'text-white' : 'text-textDark'}`}
                >
                  {appVersion || 'Loading...'}
                </Text>
              </View>
              <TouchableOpacity
                className="flex-row items-center justify-between"
                activeOpacity={0.7}
                onPress={handleContactUs}
              >
                <Text
                  className={`font-poppins-regular ${
                    isDark ? 'text-textSecondary' : 'text-textMuted'
                  }`}
                >
                  Contact Us
                </Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#8AA897' : '#658176'} />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between mt-3"
                activeOpacity={0.7}
                onPress={handleOpenTerms}
              >
                <Text
                  className={`font-poppins-regular ${
                    isDark ? 'text-textSecondary' : 'text-textMuted'
                  }`}
                >
                  Terms & Conditions
                </Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#8AA897' : '#658176'} />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between mt-3"
                activeOpacity={0.7}
                onPress={handleOpenPrivacyPolicy}
              >
                <Text
                  className={`font-poppins-regular ${
                    isDark ? 'text-textSecondary' : 'text-textMuted'
                  }`}
                >
                  Privacy Policy
                </Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#8AA897' : '#658176'} />
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
        </ScrollView>

        {/* Delete Modal */}
        <DeleteAccountModal
          visible={showDeleteModal}
          onConfirm={confirmDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      </View>
    </GradientBackground>
  );
};

export default Settings;
