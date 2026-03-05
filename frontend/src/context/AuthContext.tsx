'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getMe } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  setAuth: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('degxifi_token');
    if (savedToken) {
      setToken(savedToken);
      getMe()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem('degxifi_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setAuth = (newToken: string, newUser: User) => {
    localStorage.setItem('degxifi_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('degxifi_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const u = await getMe();
      setUser(u);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
