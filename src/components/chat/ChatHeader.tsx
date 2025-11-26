import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

import type { ConsultantConsultation } from '@/api/consultant/consultations';

interface ChatHeaderProps {
  consultation: ConsultantConsultation;
  onBack: () => void;
  onFinish?: () => void;
  isConsultant?: boolean;
  isConnecting?: boolean;
  isLoading?: boolean;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const ChatHeader: React.FC<ChatHeaderProps> = ({
  consultation,
  onBack,
  onFinish,
  isConsultant = true,
  isConnecting = false,
  isLoading = false,
}) => {
  const otherPerson = isConsultant ? consultation.user : consultation.consultant;
  const otherPersonName = otherPerson?.name || (isConsultant ? 'Client' : 'Stylist');
  const consultantDetails = consultation.consultant?.consultant_details as
    | { specialization?: string }
    | null
    | undefined;
  const specialization = consultantDetails?.specialization;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {otherPerson?.profile_picture_url ? (
          <Image source={{ uri: otherPerson.profile_picture_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(otherPersonName)}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{otherPersonName}</Text>
          {specialization ? (
            <Text style={styles.specialization}>{specialization ?? ''}</Text>
          ) : null}
        </View>

        {onFinish && consultation.status !== 'completed' && (
          <TouchableOpacity onPress={onFinish} style={styles.finishButton}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.finishText}>Finish</Text>
          </TouchableOpacity>
        )}

        {consultation.status === 'completed' && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>

      {(isConnecting || isLoading) && (
        <View
          style={[styles.statusBanner, isConnecting ? styles.offlineBanner : styles.loadingBanner]}
        >
          {isConnecting ? (
            <>
              <Ionicons name="warning" size={14} color="#3A2F00" style={styles.statusIcon} />
              <Text style={styles.offlineText}>Offline. Waiting for connection…</Text>
            </>
          ) : (
            <>
              <ActivityIndicator size="small" color="#1C1C1C" style={styles.statusIcon} />
              <Text style={styles.loadingText}>Loading messages…</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#27B07D',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  specialization: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  loadingBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  offlineBanner: {
    backgroundColor: '#FFE08A',
  },
  statusIcon: {
    marginRight: 6,
  },
  loadingText: {
    color: '#1C1C1C',
    fontSize: 12,
    fontWeight: '500',
  },
  offlineText: {
    color: '#3A2F00',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatHeader;
