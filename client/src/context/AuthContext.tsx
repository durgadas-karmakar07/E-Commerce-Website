import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/index.js';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  loginWithPhoneOtp: (phone: string, otp: string, name?: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string, name?: string) => Promise<void>;
  loginWithGoogle: (email?: string, name?: string, avatar?: string) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res: any = await api.get('/auth/profile');
      if (res.success && res.user) {
        setUser({
          ...res.user,
          id: res.user._id || res.user.id,
        });
      }
    } catch {
      clearAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    const res: any = await api.post('/auth/login', { email, password });
    if (res.token && res.user) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser({
        ...res.user,
        id: res.user._id || res.user.id,
      });
    }
  };

  const signup = async (name: string, email: string, password: string, phone?: string) => {
    const res: any = await api.post('/auth/signup', { name, email, password, phone });
    if (res.token && res.user) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser({
        ...res.user,
        id: res.user._id || res.user.id,
      });
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string }) => {
    await signup(data.name, data.email, data.password, data.phone);
  };

  const sendPhoneOtp = async (phone: string) => {
    await api.post('/auth/phone-otp/request', { phone });
  };

  const loginWithPhoneOtp = async (phone: string, otp: string, name?: string) => {
    const res: any = await api.post('/auth/phone-otp/verify', { phone, otp, name });
    if (res.token && res.user) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser({
        ...res.user,
        id: res.user._id || res.user.id,
      });
    }
  };

  const loginWithGoogle = async (
    email = 'user.demo@google.com',
    name = 'Google Shopper',
    avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
  ) => {
    const res: any = await api.post('/auth/google', { email, name, avatar });
    if (res.token && res.user) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser({
        ...res.user,
        id: res.user._id || res.user.id,
      });
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isLoading,
    isAdmin: user?.role === 'admin',
    login,
    loginWithPassword: login,
    signup,
    register,
    sendPhoneOtp,
    loginWithPhoneOtp,
    verifyPhoneOtp: loginWithPhoneOtp,
    loginWithGoogle,
    updateUser,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
