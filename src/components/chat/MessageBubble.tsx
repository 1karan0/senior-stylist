import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

import type { ChatLinkPreview, ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  onImagePress?: (imageUrl: string) => void;
  onRetry?: (messageId: string) => void;
}

const formatTime = (value: string) => {
  const date = new Date(value);
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
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
  const renderLinkPreview = (preview: ChatLinkPreview) => (
    <View
      style={[styles.linkPreview, isOwnMessage ? styles.linkPreviewOwn : styles.linkPreviewOther]}
    >
      {preview.image ? (
        <Image source={{ uri: preview.image }} style={styles.linkPreviewImage} resizeMode="cover" />
      ) : null}
      <View
        style={[
          styles.linkPreviewContent,
          isOwnMessage ? styles.linkPreviewContentOwn : styles.linkPreviewContentOther,
        ]}
      >
        {preview.site_name ? (
          <Text
            style={[
              styles.linkPreviewSite,
              isOwnMessage ? styles.linkPreviewSiteOwn : styles.linkPreviewSiteOther,
            ]}
          >
            {preview.site_name.toUpperCase()}
          </Text>
        ) : null}
        {preview.title ? (
          <Text
            style={[
              styles.linkPreviewTitle,
              isOwnMessage ? styles.linkPreviewTitleOwn : styles.linkPreviewTitleOther,
            ]}
            numberOfLines={2}
          >
            {preview.title}
          </Text>
        ) : null}
        {preview.description ? (
          <Text
            style={[
              styles.linkPreviewDescription,
              isOwnMessage ? styles.linkPreviewDescriptionOwn : styles.linkPreviewDescriptionOther,
            ]}
            numberOfLines={2}
          >
            {preview.description}
          </Text>
        ) : null}
        {preview.show_buy_now_button ? (
          <TouchableOpacity
            style={[
              styles.buyNowButton,
              isOwnMessage ? styles.buyNowButtonOwn : styles.buyNowButtonOther,
            ]}
            onPress={() => Linking.openURL(preview.url)}
          >
            <Text
              style={[
                styles.buyNowText,
                isOwnMessage ? styles.buyNowTextOwn : styles.buyNowTextOther,
              ]}
            >
              Buy Now
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => Linking.openURL(preview.url)}>
            <Text
              style={[styles.linkUrl, isOwnMessage ? styles.linkUrlOwn : styles.linkUrlOther]}
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
    <View style={[styles.container, isOwnMessage ? styles.containerOwn : styles.containerOther]}>
      <View style={[styles.bubble, isOwnMessage ? styles.bubbleOwn : styles.bubbleOther]}>
        {message.message ? (
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.messageTextOwn : styles.messageTextOther,
            ]}
          >
            {removeUrlsFromText(message.message, message.link_preview)}
          </Text>
        ) : null}

        {message.link_preview ? renderLinkPreview(message.link_preview) : null}

        {message.attachment_url ? (
          <View style={styles.attachmentContainer}>
            {isImageUrl(message.attachment_url, message.message_type) ? (
              <TouchableOpacity
                onPress={() => onImagePress?.(message.attachment_url!)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: message.attachment_url }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => Linking.openURL(message.attachment_url!)}>
                <Text
                  style={[
                    styles.attachmentLink,
                    isOwnMessage ? styles.attachmentLinkOwn : styles.attachmentLinkOther,
                  ]}
                >
                  View attachment
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        <View style={styles.timestampContainer}>
          <Text
            style={[styles.timestamp, isOwnMessage ? styles.timestampOwn : styles.timestampOther]}
          >
            {formatTime(message.created_at)}
          </Text>
          {isOwnMessage && message.status === 'pending' ? (
            <Ionicons
              name="time-outline"
              size={12}
              color="rgba(255, 255, 255, 0.7)"
              style={styles.statusIcon}
            />
          ) : null}
          {isOwnMessage && message.status === 'failed' ? (
            <TouchableOpacity
              onPress={() => onRetry?.(message.temp_id || message.id)}
              style={styles.retryButton}
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

const styles = StyleSheet.create({
  container: { marginVertical: 4, paddingHorizontal: 16 },
  containerOwn: { alignItems: 'flex-end' },
  containerOther: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  bubbleOwn: { backgroundColor: '#27B07D', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#1A1A1A', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  messageTextOwn: { color: '#FFFFFF' },
  messageTextOther: { color: '#FFFFFF' },
  timestampContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  timestamp: { fontSize: 11 },
  timestampOwn: { color: 'rgba(255, 255, 255, 0.7)' },
  timestampOther: { color: '#A1A09A' },
  statusIcon: { marginLeft: 2 },
  retryButton: { marginLeft: 4, padding: 4 },
  attachmentContainer: { marginTop: 8 },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#152821',
  },
  attachmentLink: { fontSize: 14, textDecorationLine: 'underline' },
  attachmentLinkOwn: { color: '#FFFFFF' },
  attachmentLinkOther: { color: '#27B07D' },
  linkPreview: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
  linkPreviewOwn: { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  linkPreviewOther: { borderWidth: 1, borderColor: '#152821' },
  linkPreviewImage: { width: '100%', height: 160, backgroundColor: '#0E1B16' },
  linkPreviewContent: { padding: 12 },
  linkPreviewContentOwn: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  linkPreviewContentOther: { backgroundColor: '#0E1B16' },
  linkPreviewSite: { fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  linkPreviewSiteOwn: { color: 'rgba(255, 255, 255, 0.6)' },
  linkPreviewSiteOther: { color: '#A1A09A' },
  linkPreviewTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  linkPreviewTitleOwn: { color: '#FFFFFF' },
  linkPreviewTitleOther: { color: '#FFFFFF' },
  linkPreviewDescription: { fontSize: 12, marginBottom: 8 },
  linkPreviewDescriptionOwn: { color: 'rgba(255, 255, 255, 0.8)' },
  linkPreviewDescriptionOther: { color: '#A1A09A' },
  buyNowButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginTop: 4 },
  buyNowButtonOwn: { backgroundColor: '#FFFFFF' },
  buyNowButtonOther: { backgroundColor: '#27B07D' },
  buyNowText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  buyNowTextOwn: { color: '#27B07D' },
  buyNowTextOther: { color: '#FFFFFF' },
  linkUrl: { fontSize: 12, textDecorationLine: 'underline', marginTop: 4 },
  linkUrlOwn: { color: 'rgba(255, 255, 255, 0.8)' },
  linkUrlOther: { color: '#A1A09A' },
});

export default MessageBubble;
