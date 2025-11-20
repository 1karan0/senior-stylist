import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgetPassword: undefined;
  OtpVerification: undefined;
  Pricing: undefined;
};

export type ConsultationStackParamList = {
  ConsultationHome: undefined;
  ConsultationDetail: undefined;
  ConsultationChat: undefined;
};

export type NewsStackParamList = {
  NewsHome: undefined;
  NewsDetail: undefined;
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

export type MainTabParamList = {
  ConsultationTab: undefined;
  NewsTab: undefined;
  StoreTab: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  Pricing: undefined;
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
  signup: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUserData: User) => Promise<void>;
  isAuthenticated: boolean;
}

export type RootStackParamList = {
  Root: undefined;
  Auth: undefined;
  Main: undefined;
};
