import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

interface StripeWebViewModalProps {
  visible: boolean;
  url: string;
  title?: string;
  onClose: () => void;
}

const StripeWebViewModal: React.FC<StripeWebViewModalProps> = ({
  visible,
  url,
  title,
  onClose,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleClose = () => {
    setLoading(true);
    setError(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar
        translucent
        backgroundColor={isDark ? '#0D1A16' : '#FFFFFF'}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View
        className="flex-1"
        style={{
          backgroundColor: isDark ? '#0D1A16' : '#FFFFFF',
          paddingTop: insets.top,
        }}
      >
        {/* Header */}
        <View
          className={`flex-row items-center justify-between px-4 py-3 border-b ${
            isDark ? 'bg-[#0D1A16] border-commonGradientStop7' : 'bg-white border-[#E6E6E6]'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 -ml-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={
                isDark
                  ? require('@/assets/icons/green-back.png')
                  : require('@/assets/icons/back.png')
              }
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text
            className={`flex-1 ml-2 text-base font-semibold ${isDark ? 'text-white' : 'text-textDark'}`}
            numberOfLines={1}
          >
            {title || 'Stripe'}
          </Text>
          <View className="w-10" />
        </View>

        {/* WebView Container */}
        <View className="flex-1 relative">
          {error ? (
            <View className="flex-1 justify-center items-center px-6">
              <Text
                className={`text-center text-lg font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-textDark'
                }`}
              >
                Unable to Load Stripe
              </Text>
              <Text
                className={`text-center text-sm mb-6 ${
                  isDark ? 'text-textSecondary' : 'text-textMuted'
                }`}
              >
                Please check your internet connection and try again.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setError(false);
                  setLoading(true);
                }}
                className="px-8 py-3 bg-[#00C896] rounded-xl"
                style={{
                  shadowColor: '#00C896',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text className="text-white font-semibold text-base">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <WebView
                source={{ uri: url }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setError(true);
                  setLoading(false);
                }}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                thirdPartyCookiesEnabled={true}
                mixedContentMode="always"
                userAgent={
                  Platform.OS === 'ios'
                    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
                    : 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
                }
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default StripeWebViewModal;
