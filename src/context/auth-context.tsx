
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

const jwtDecode = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export type UserRole = 'admin' | 'doctor' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  reset_initial_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  getAuthToken: () => string | null;
  refreshUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadStateFromStorage = () => {
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        const decodedUser = jwtDecode(storedToken);
        if (decodedUser) {
          setAuthToken(storedToken);
          const storedUser: User = {
            id: decodedUser.user_id,
            name: decodedUser.name,
            email: decodedUser.email,
            role: decodedUser.role,
            avatarUrl: `https://placehold.co/32x32.png`,
            reset_initial_password: localStorage.getItem('reset_initial_password') === 'true',
          };
          setUser(storedUser);
        }
      }
    } catch (error) {
       console.error("Error loading auth state from storage:", error);
       localStorage.clear();
       setUser(null);
       setAuthToken(null);
    } finally {
        setIsLoading(false);
    }
  };
  
  const saveStateToStorage = (userState: User, token: string) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('reset_initial_password', String(!!userState.reset_initial_password));
  }

  useEffect(() => {
    loadStateFromStorage();
  }, []);
  
  const refreshUser = async (updates: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser || !authToken) return null;
      const updatedUser = { ...prevUser, ...updates };
      saveStateToStorage(updatedUser, authToken);
      return updatedUser;
    });
  }

  const login = async (email: string, pass: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    const { access: token, reset_initial_password } = data;
    const decodedUser = jwtDecode(token);
    
    if (decodedUser) {
        const currentUser: User = {
            id: decodedUser.user_id,
            name: decodedUser.name,
            email: decodedUser.email,
            role: decodedUser.role,
            avatarUrl: `https://placehold.co/32x32.png`,
            reset_initial_password: reset_initial_password,
        };
        setAuthToken(token);
        setUser(currentUser);
        saveStateToStorage(currentUser, token);
        
        // --- NEW REDIRECTION STRATEGY ---
        // Directly navigate from here based on the API response.
        if (reset_initial_password) {
            router.push('/dashboard/change-password');
        } else {
            router.push('/dashboard');
        }
    } else {
        throw new Error("Failed to decode token after login.");
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setAuthToken(null);
    router.push('/');
  };

  const getAuthToken = () => {
    return authToken;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, getAuthToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
