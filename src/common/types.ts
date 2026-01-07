import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgetPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  OtpVerification: undefined;
  Pricing: { fromSignup?: boolean; fromProfile?: boolean } | undefined;
};

export type ConsultationStackParamList = {
  ConsultationHome: undefined;
  ConsultationDetail: undefined;
  ConsultationChat: undefined;
  NoConsultant: undefined;
  NewConsultant: undefined;
};

export type NewsStackParamList = {
  NewsHome: undefined;
  NewsDetail: {
    slug: string; // only slug/name goes here
  };
  NewsCategory: undefined;
};

export type StoreStackParamList = {
  StoreHome: undefined;
  ProductDetail: undefined;
  Cart: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: { profile: ProfileUser };
  Settings: undefined;
  CreateDispute: undefined;
  SubmitDispute: { consultationId: number };
  DisputeList: undefined;
  DisputeDetails: { disputeId: number };
};

export type AppStackParamList = {
  UserTabs: undefined;
  ConsultantTabs: undefined;
  ConsultantChat: { consultationId: number; asCustomer?: boolean };
  Pricing: { fromSignup?: boolean; fromProfile?: boolean } | undefined;
};

export type MainTabParamList = {
  ConsultationTab: undefined;
  NewsTab: undefined;
  StoreTab: undefined;
  ProfileTab: undefined;
};

export type ConsultantTabParamList = {
  DashboardTab: undefined;
  RequestTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

// Navigation prop types
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type ConsultationNavigationProp = NativeStackNavigationProp<ConsultationStackParamList>;
export type NewsNavigationProp = NativeStackNavigationProp<NewsStackParamList>;
export type StoreNavigationProp = NativeStackNavigationProp<StoreStackParamList>;
export type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  status: string;
  cv_path: string | null;
  profile_picture_url: string | null;
  email_verified_at: string | null;
  email_verified: boolean;
  onboarding_status: string;
  email_verified_at_custom: string;
  subscription_purchased_at: string | null;
  onboarding_completed_at: string;
  last_app_access_at: string | null;
  last_session_at: string | null;
  last_app_version: string | null;
  last_device_type: string | null;
  last_ip_address: string | null;
  is_away: boolean;
  away_since: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  status: string;
  code: number;
  message: string;
  data: {
    user: User;
    access_token: string;
    token_type: string;
    firebase_custom_token: string;
  };
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  verifyEmail: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUserData: User) => Promise<void>;
  isAuthenticated: boolean;
}

export type RootStackParamList = {
  Root: undefined;
  Auth: undefined;
  UserApp: undefined;
  ConsultantApp: undefined;
};

export interface ConsultantDetails {
  id: number;
  user_id: number;
  specialization: string | null;
  bio: string | null;
  years_experience: number;
  average_rating: string;
  total_sessions: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Consultant {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  role: string;
  status: string;
  cv_path: string | null;
  profile_picture_url: string | null;
  email_verified_at: string | null;
  email_verified: boolean;
  onboarding_status: string;
  onboarding_completed_at: string | null;
  subscription_purchased_at: string | null;
  last_app_access_at: string | null;
  last_session_at: string | null;
  last_app_version: string | null;
  last_device_type: string | null;
  last_ip_address: string | null;
  is_away: boolean;
  away_since: string | null;
  created_at: string;
  updated_at: string;
  consultant_details: ConsultantDetails | null;
}

export interface Message {
  id?: number;
  message?: string;
  read?: boolean;
  created_at?: string;
}

export interface ConsultationItem {
  id: number;
  status: string;
  problem_description: string;
  updated_at: string;
  consultant: Consultant | null;
  messages: Message[];
}

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  body: string;
  author: string;
  published_date: string;
  created_at: string;
  views_count: number; // ← add this
  category: NewsCategory | null;
  external_url?: string;
  open_in_webview?: boolean;
  source_type?: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  body: string; // this is the HTML string
  author: string;
  published_date: string; // "2025-11-13"
  created_at: string; // ISO date format
  views_count: number;
  category: NewsCategory | null;
}

export interface ConversationPreview {
  id: number;
  title: string;
  avatarUrl?: string | null;
  lastMessage: string;
  lastMessageAt?: string | null;
  unreadCount: number;
}

export interface ReferralStats {
  total_referrals: number;
  total_rewards_earned: number;
  total_rewards_available: number;
}

export interface ProfileSubscription {
  is_active: boolean;
  platform: string;
  plan_id: number;
  plan_name: string;
  plan_slug: string;
  store_plan_id: string;
  offer_plan_id: string | null;
  // Android: purchase token used for subscription replacement (upgrade/downgrade)
  purchase_token?: string | null;
  expires_at: string | null;
  next_billing_date: string | null;
  auto_renew: boolean;
  status: string;
  consultations_allowed: number;
  consultations_used: number;
  consultations_remaining: number;
  is_in_discount_period: boolean;
  discount_ends_at: string | null;
  scheduled_change: any | null;
}

export interface ProfileUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  profile_picture_url: string | null;
  role: string;
  referral_code: string;
  created_at: string;
  is_away: boolean;
  away_since: string | null;
  referral_stats?: ReferralStats;
}

export interface DisputeResponse {
  disputes: ConsultantDispute[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  total_pages: number;
}

export interface ConsultantDisputeResolution {
  resolved_at: string;
  resolution_notes: string | null;
  penalty_amount: number | null;
  penalty_notes: string | null;
  resolved_by: string;
}

export interface ConsultantDispute {
  id: number;
  consultation_id: number;
  status: 'in_progress' | 'closed' | 'resolved';
  created_at: string;
  resolution: ConsultantDisputeResolution | null;
}

export interface ConsultantDisputesApiResponse {
  status: string;
  code: number;
  message: string;
  data: {
    disputes: ConsultantDispute[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  };
}

export interface EarningConsultationRequest {
  id: number;
  user_id: number;
  consultant_id: number;
  problem_description: string;
  image_path?: string | null;
  image_storage_path?: string | null;
  image_public_url?: string | null;
  status: string;
  requested_at: string;
  assigned_at: string;
  started_at?: string | null;
  completed_at: string;
  expires_at: string;
  rating?: number | null;
  user_feedback?: string | null;
  consultant_notes?: string | null;
}

export interface EarningMonthlyPot {
  id: number;
  year: number;
  month: number;
  pot_amount: string;
  projected_consultations: number;
  strike_price: string;
  status: string;
}

export interface EarningItem {
  id: number;
  stylist_id: number;
  consultation_request_id: number;
  monthly_pot_id: number;
  strike_price: string;
  gross_amount: string;
  platform_fee: string;
  net_amount: string;
  status: string;
  earned_at: string;
  hold_until?: string;
  dispute_until?: string;
  dispute_id?: number | null;
  refund_amount?: string | null;
  refunded_at?: string | null;
  refunded_by?: number | null;
  refund_notes?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  consultation_request?: EarningConsultationRequest;
  monthly_pot?: EarningMonthlyPot;
}

export interface EarningHistoryPagination {
  current_page: number;
  data: EarningItem[];
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export interface EarningHistoryResponse {
  status: string;
  code: number;
  message: string;
  data: EarningHistoryPagination | EarningItem[];
}

export interface PayoutItem {
  id?: string | number;
  type?: string;
  status?: string;
  requested_amount?: number | string;
  processed_amount?: number | string;
  stripe_fee_amount?: number | string;
  net_amount?: number | string;
  stripe_payout_id?: string;
  created_at?: string;
  processed_at?: string;
  failure_reason?: string | null;
  // Legacy field names for backward compatibility
  amount?: number | string;
  netAmount?: number | string;
  fees?: number | string;
  transfer_id?: string;
  transferId?: string;
  createdAt?: string;
  date?: string;
}
