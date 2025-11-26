export interface ChatLinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  site_name?: string;
  show_buy_now_button?: boolean;
}

export interface ChatMessage {
  id: string;
  temp_id?: string;
  user_id: string;
  user_name: string;
  message?: string;
  message_type: string;
  attachment_url?: string;
  link_preview?: ChatLinkPreview;
  is_read: boolean;
  status?: 'pending' | 'sent' | 'failed';
  created_at: string;
}
