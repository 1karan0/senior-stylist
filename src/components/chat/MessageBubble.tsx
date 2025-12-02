import React from 'react';
import { Linking, Text, TouchableOpacity, View, Image } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/contexts/ThemeContext';

import type { ChatLinkPreview, ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  onImagePress?: (imageUrl: string) => void;
  onRetry?: (messageId: string) => void;
}

const formatTime = (value: string) => {
  const date = new Date(value);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

const removeUrlsFromText = (text: string, linkPreview?: ChatLinkPreview) => {
  if (!text || !linkPreview?.show_buy_now_button) {
    return text;
  }
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.replace(urlRegex, '').trim();
};

const isImageUrl = (url?: string, messageType?: string) => {
  if (messageType === 'image') {
    return !!url;
  }
  return !!url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  onImagePress,
  onRetry,
}) => {
  const { isDark } = useTheme();
  const renderLinkPreview = (preview: ChatLinkPreview) => (
    <View
      className={`mt-2 rounded-xl overflow-hidden border ${
        isOwnMessage ? 'border-white/20' : 'border-[#152821]'
      }`}
    >
      {preview.image ? (
        <Image
          source={{ uri: preview.image }}
          className="w-full h-40 bg-commonGradientStop6"
          resizeMode="cover"
        />
      ) : null}
      <View className={`p-3 ${isOwnMessage ? 'bg-white/10' : 'bg-commonGradientStop6'}`}>
        {preview.site_name ? (
          <Text
            className={`text-[10px] tracking-widest mb-1 ${
              isOwnMessage ? 'text-white/60' : 'text-[#A1A09A]'
            }`}
          >
            {preview.site_name.toUpperCase()}
          </Text>
        ) : null}
        {preview.title ? (
          <Text
            className={`text-sm font-semibold mb-1 ${isOwnMessage ? 'text-white' : 'text-white'}`}
            numberOfLines={2}
          >
            {preview.title}
          </Text>
        ) : null}
        {preview.description ? (
          <Text
            className={`text-xs mb-2 ${isOwnMessage ? 'text-white/80' : 'text-[#A1A09A]'}`}
            numberOfLines={2}
          >
            {preview.description}
          </Text>
        ) : null}
        {preview.show_buy_now_button ? (
          <TouchableOpacity
            className={`py-2 px-4 rounded-lg mt-1 ${isOwnMessage ? 'bg-white' : 'bg-buttonPrimaryBg'}`}
            onPress={() => Linking.openURL(preview.url)}
          >
            <Text
              className={`text-sm font-semibold text-center ${
                isOwnMessage ? 'text-textPrimary' : 'text-white'
              }`}
            >
              Buy Now
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => Linking.openURL(preview.url)}>
            <Text
              className={`text-xs underline mt-1 ${
                isOwnMessage ? 'text-white/80' : 'text-[#A1A09A]'
              }`}
              numberOfLines={1}
            >
              {preview.url}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View className={`my-1 px-4 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[75%] p-3 rounded-2xl ${
          isOwnMessage
            ? `bg-commonGradientStop2 ${isDark ? 'border-commonGradientStop5' : 'border-[#DAE7E0]'} border rounded-br-sm`
            : ` ${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-[#DAE7E0]'} border rounded-bl-sm`
        }`}
      >
        {message.message ? (
          <Text
            className={`text-base leading-5 ${
              isOwnMessage ? `text-white` : ` ${isDark ? 'text-white' : 'text-[#1C1C1C]'}`
            }`}
          >
            {removeUrlsFromText(message.message, message.link_preview)}
          </Text>
        ) : null}

        {message.link_preview ? renderLinkPreview(message.link_preview) : null}

        {message.attachment_url ? (
          <View className="mt-2">
            {isImageUrl(message.attachment_url, message.message_type) ? (
              <TouchableOpacity
                onPress={() => onImagePress?.(message.attachment_url!)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: message.attachment_url }}
                  className="w-[200px] h-[200px] rounded-xl border border-[#152821]"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => Linking.openURL(message.attachment_url!)}>
                <Text
                  className={`text-sm underline ${isOwnMessage ? 'text-white' : 'text-textPrimary'}`}
                >
                  View attachment
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        <View className="flex-row items-center mt-1 gap-1">
          <Text className={`text-[10px] ${isOwnMessage ? 'text-white/70' : 'text-[#8E8E93]'}`}>
            {formatTime(message.created_at)}
          </Text>
          {isOwnMessage && message.status === 'pending' ? (
            <Ionicons
              name="time-outline"
              size={12}
              color="rgba(255, 255, 255, 0.7)"
              style={{ marginLeft: 2 }}
            />
          ) : null}
          {isOwnMessage && message.status === 'failed' ? (
            <TouchableOpacity
              onPress={() => onRetry?.(message.temp_id || message.id)}
              className="ml-1 p-1"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh" size={14} color="#FF4433" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default MessageBubble;
