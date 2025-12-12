import type { ConsultantConsultation } from '@/api/consultant/consultations';
import type { ConversationPreview } from '@/common/types';

/**
 * Get timestamp value from a date string
 */
export const getTimestampValue = (value?: string | null): number => {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Sort consultations by latest message or requested date
 */
export const sortByLatest = (
  items: ConsultantConsultation[],
  getTimestamp: (value?: string | null) => number = getTimestampValue
): ConsultantConsultation[] => {
  return [...items].sort(
    (a, b) =>
      getTimestamp(b.last_message_at ?? b.requested_at) -
      getTimestamp(a.last_message_at ?? a.requested_at)
  );
};

/**
 * Merge old and new consultation data, preserving existing properties
 */
export const mergeConsultations = (
  oldData: ConsultantConsultation[],
  newData: ConsultantConsultation[]
): ConsultantConsultation[] => {
  const map = new Map<number, ConsultantConsultation>();
  oldData.forEach((i) => map.set(i.id, i));
  newData.forEach((i) => {
    const prev = map.get(i.id);
    map.set(i.id, { ...prev, ...i });
  });
  return Array.from(map.values());
};

/**
 * Create a conversation preview from a consultation
 */
export const createPreview = (c: ConsultantConsultation): ConversationPreview => ({
  id: c.id,
  title: c.consultant?.name || 'Unknown Consultant',
  avatarUrl: c.consultant?.profile_picture_url,
  lastMessage: c.last_message || c.problem_description || 'Tap to view conversation',
  lastMessageAt: c.last_message_at ?? c.requested_at,
  unreadCount: c.unread_count_user ?? 0,
});

/**
 * Filter consultations by user ID
 */
export const filterByUser = (
  list: ConsultantConsultation[],
  userKey: string | null
): ConsultantConsultation[] => {
  return userKey ? list.filter((c) => String(c.user_id ?? '') === userKey) : [];
};

/**
 * Filter consultations by consultant ID
 */
export const filterByConsultant = (
  list: ConsultantConsultation[],
  consultantKey: string | null
): ConsultantConsultation[] => {
  return consultantKey ? list.filter((c) => String(c.consultant_id ?? '') === consultantKey) : [];
};

/**
 * Create a conversation preview for consultant view
 */
export const createConsultantPreview = (c: ConsultantConsultation): ConversationPreview => ({
  id: c.id,
  title: c.user?.name || 'Unknown User',
  avatarUrl: c.user?.profile_picture_url,
  lastMessage: c.last_message || c.problem_description || 'Tap to view conversation',
  lastMessageAt: c.last_message_at ?? c.requested_at,
  unreadCount: c.unread_count_consultant ?? 0,
});

/**
 * Filter conversations by search query and filter type
 */
export const filterConsultantConversations = (
  previews: ConversationPreview[],
  searchQuery: string,
  activeFilter: 'all' | 'unread'
): ConversationPreview[] => {
  const queryLower = searchQuery.trim().toLowerCase();

  return previews.filter((conversation) => {
    const matchesSearch =
      !queryLower ||
      conversation.title.toLowerCase().includes(queryLower) ||
      conversation.lastMessage.toLowerCase().includes(queryLower);

    const matchesFilter =
      activeFilter === 'all' || (activeFilter === 'unread' && conversation.unreadCount > 0);

    return matchesSearch && matchesFilter;
  });
};

/**
 * Get initials from a name string
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((x) => x.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

/**
 * Get relative time string (e.g., "5m ago", "2h ago", "3d ago")
 */
export const getRelativeTime = (ts?: string | null): string => {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/**
 * Filter conversation previews by search query
 */
export const filterConversations = (
  previews: ConversationPreview[],
  searchQuery: string
): ConversationPreview[] => {
  const term = searchQuery.toLowerCase().trim();
  if (!term) return previews;
  return previews.filter(
    (p) => p.title.toLowerCase().includes(term) || p.lastMessage.toLowerCase().includes(term)
  );
};
