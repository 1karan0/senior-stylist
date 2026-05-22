export type User = {
    id: string;
    name: string;
    email: string;
    token: string;
};

export type AuthContextValue = {
    isAuthenticated: boolean;
    user: User | null;
    token: User['token'] | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
};
export type RootStackParamList={
    Root: undefined;
}
export type AppStackParamList = {
    UserTabs: undefined;
    Home: undefined;
    Profile: undefined;
    Tasks: undefined;
    Scanner: undefined;
  };
export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
  };