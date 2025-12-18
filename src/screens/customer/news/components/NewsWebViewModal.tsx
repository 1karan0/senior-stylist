import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { ModalWrapper } from '@/common/components/ModalWrapper';
import { useTheme } from '@/contexts/ThemeContext';

interface NewsWebViewModalProps {
  visible: boolean;
  url: string;
  title: string;
  onClose: () => void;
}

const NewsWebViewModal: React.FC<NewsWebViewModalProps> = ({ visible, url, title, onClose }) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleClose = () => {
    setLoading(true);
    setError(false);
    onClose();
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={handleClose}
      dismissOnBackdropPress={false}
      containerClassName={`flex-1 w-full h-full m-0 p-0 rounded-none ${
        isDark ? 'bg-[#0D1A16]' : 'bg-white'
      }`}
    >
      <StatusBar
        translucent
        backgroundColor={isDark ? '#0D1A16' : '#FFFFFF'}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View className="flex-1" style={{ backgroundColor: isDark ? '#0D1A16' : '#FFFFFF' }}>
        {/* Header */}
        <View
          className={`flex-row items-center justify-between px-5  py-4 border-b ${
            isDark ? 'bg-[#0D1A16] border-commonGradientStop7' : 'bg-white border-[#E6E6E6]'
          }`}
          style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 }}
        >
          <TouchableOpacity onPress={handleClose} className="p-2">
            <Image
              source={
                isDark
                  ? require('@/assets/icons/green-back.png')
                  : require('@/assets/icons/back.png')
              }
              className="w-6 h-6"
            />
          </TouchableOpacity>
          {title && (
            <Text
              className={`flex-1 ml-4 text-lg font-semibold ${
                isDark ? 'text-white' : 'text-textDark'
              }`}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          <View className="w-10" />
        </View>

        {/* WebView Container */}
        <View className="flex-1">
          {error ? (
            <View className="flex-1 justify-center items-center px-5">
              <Text className={`text-center ${isDark ? 'text-white' : 'text-textDark'}`}>
                Unable to load the article. Please check your internet connection.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setError(false);
                  setLoading(true);
                }}
                className="mt-4 px-6 py-3 bg-[#00C896] rounded-xl"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
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
          )}
        </View>
      </View>
    </ModalWrapper>
  );
};

export default NewsWebViewModal;
