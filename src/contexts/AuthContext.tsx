import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, clearToken, getToken } from '@/lib/apiClient';

// ─── User type (replaces Supabase User) ──────────────────────────────────────
export interface AppUser {
  id: string;
  email: string;
  fullName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  paidUser?: boolean;
}

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    username?: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /** Fetch the current user from /api/auth/me using the stored JWT */
  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<AppUser>('/auth/me');
      setUser(data);
    } catch {
      // Token invalid / expired
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: hydrate user from stored JWT
  useEffect(() => {
    loadUser();

    // Listen for token expiry events fired by apiClient
    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('magic_ai_auth_expired', handleExpired);
    return () => window.removeEventListener('magic_ai_auth_expired', handleExpired);
  }, [loadUser]);

  // ─── signUp ────────────────────────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    username?: string
  ): Promise<{ error: any }> => {
    try {
      const data = await api.post<{ token: string; user: AppUser }>('/auth/register', {
        email,
        password,
        fullName,
        username,
      });
      setToken(data.token);
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Registration failed' } };
    }
  };

  // ─── signIn ────────────────────────────────────────────────────────────────
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: any }> => {
    try {
      const data = await api.post<{ token: string; user: AppUser }>('/auth/login', {
        email,
        password,
      });
      setToken(data.token);
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Login failed' } };
    }
  };

  // ─── signOut ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore server errors on logout
    } finally {
      clearToken();
      setUser(null);
    }
  };

  // ─── refreshUser ───────────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
