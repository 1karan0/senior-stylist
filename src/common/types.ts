import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgetPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  OtpVerification: undefined;
  Pricing: undefined;
};

export type ConsultationStackParamList = {
  ConsultationHome: undefined;
  ConsultationDetail: undefined;
  ConsultationChat: undefined;
  NoConsultant: undefined;
  NewConsultant: undefined;
  FindingStylist: { consultationId: number };
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
  EditProfile: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  UserTabs: undefined;
  ConsultantTabs: undefined;
  ConsultantChat: { consultationId: number; asCustomer?: boolean };
  Pricing: undefined;
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
