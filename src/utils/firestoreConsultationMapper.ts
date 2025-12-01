import { ConsultantConsultation } from '@/api/consultant/consultations';

const normalizeTimestamp = (value: any): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  const parsed = new Date(value).toISOString();
  return parsed;
};

const toNumber = (value: any): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

export const mapFirestoreConsultation = (
  docId: string,
  data: Record<string, any>
): ConsultantConsultation => {
  const id = Number(docId);
  const userId = toNumber(data.user_id) ?? 0;
  const consultantId = toNumber(data.consultant_id);
  const requestedAt = normalizeTimestamp(data.requested_at) ?? new Date().toISOString();

  return {
    id,
    user_id: userId,
    consultant_id: consultantId,
    problem_description: data.problem_description ?? '',
    image_path: data.image_url ?? data.image_path ?? undefined,
    status: data.status ?? 'pending',
    requested_at: requestedAt,
    assigned_at: normalizeTimestamp(data.assigned_at),
    started_at: normalizeTimestamp(data.started_at),
    completed_at: normalizeTimestamp(data.completed_at),
    expires_at: normalizeTimestamp(data.expires_at),
    rating: data.rating ?? undefined,
    rating_comment: data.rating_comment ?? undefined,
    chat_window_is_open: data.chat_window_is_open ?? false,
    chat_window_expires_at: normalizeTimestamp(data.chat_window_expires_at),
    chat_window_days: typeof data.chat_window_days === 'number' ? data.chat_window_days : undefined,
    last_message: data.last_message ?? '',
    last_message_at: normalizeTimestamp(data.last_message_at) ?? requestedAt,
    last_message_sender_id: data.last_message_sender_id ?? null,
    unread_count_consultant: data.unread_count_consultant ?? 0,
    unread_count_user: data.unread_count_user ?? 0,
    consultant: consultantId
      ? {
          id: consultantId,
          name: data.consultant_name ?? '',
          email: '',
          profile_picture_url: data.consultant_profile_picture_url ?? null,
          consultant_details: null,
        }
      : null,
    user: {
      id: userId,
      name: data.user_name ?? '',
      email: '',
      profile_picture_url: data.user_profile_picture_url ?? null,
    },
  };
};
