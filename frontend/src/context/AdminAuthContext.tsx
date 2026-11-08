import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../services/apiFetch';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'staff' | 'viewer';
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface AdminAuthContextType {
  user: AdminUser | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  token: null,
  refreshToken: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  refreshAccessToken: async () => {},
});

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_access_token');
    const storedRefreshToken = localStorage.getItem('admin_refresh_token');
    const storedUser = localStorage.getItem('admin_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error al restaurar sesión:', error);
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem('admin_access_token', token);
    else localStorage.removeItem('admin_access_token');
  }, [token]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem('admin_refresh_token', refreshToken);
    else localStorage.removeItem('admin_refresh_token');
  }, [refreshToken]);

  useEffect(() => {
    if (user) localStorage.setItem('admin_user', JSON.stringify(user));
    else localStorage.removeItem('admin_user');
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiFetch('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as any).detail || 'Credenciales inválidas');
      }

      const data = await response.json();
      setToken(data.access);
      setRefreshToken(data.refresh);
      setUser(data.user);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const response = await apiFetch('/auth/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        logout();
        return;
      }

      const data = await response.json();
      setToken(data.access);
    } catch (error) {
      console.error('Error al refrescar token:', error);
      logout();
    }
  };

  const value: AdminAuthContextType = {
    user,
    token,
    refreshToken,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshAccessToken,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
