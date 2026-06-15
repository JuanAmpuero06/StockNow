import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { User, LoginResponse } from '../types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'admin' | 'manager' | 'operator' | 'user') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial del usuario si hay token
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await apiClient.get<User>('/auth/me');
        setUser(data);
      } catch (error) {
        console.error('Error al recuperar sesión inicial:', error);
        // Limpiamos token inválido o expirado
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email: string, password: string) => {
    // OAuth2PasswordRequestForm espera datos URL encoded
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const { data } = await apiClient.post<LoginResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);

    // Recuperar detalles del usuario
    const userRes = await apiClient.get<User>('/auth/me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`
      }
    });
    setUser(userRes.data);
  };

  const register = async (email: string, password: string, role: 'admin' | 'manager' | 'operator' | 'user') => {
    await apiClient.post('/auth/register', { email, password, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
