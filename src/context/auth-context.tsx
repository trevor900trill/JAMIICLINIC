
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
  specialty_set?: boolean;
  clinic_created?: boolean;
  new_clinic_id?: number | null;
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
            specialty_set: localStorage.getItem('specialty_set') === 'true',
            clinic_created: localStorage.getItem('clinic_created') === 'true',
            new_clinic_id: Number(localStorage.getItem('new_clinic_id')) || null,
          };
          setUser(storedUser);
        }
      }
    } catch (error) {
       console.error("Error loading auth state from storage:", error);
       // Clear potentially corrupted state
       localStorage.clear();
       setUser(null);
       setAuthToken(null);
    }
  };
  
  const saveStateToStorage = (userState: User, token: string) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('reset_initial_password', String(!!userState.reset_initial_password));
      localStorage.setItem('specialty_set', String(!!userState.specialty_set));
      localStorage.setItem('clinic_created', String(!!userState.clinic_created));
      if (userState.new_clinic_id) {
        localStorage.setItem('new_clinic_id', String(userState.new_clinic_id));
      } else {
        localStorage.removeItem('new_clinic_id');
      }
  }

  useEffect(() => {
    setIsLoading(true);
    loadStateFromStorage();
    setIsLoading(false);
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
    const { access: token, reset_initial_password, specialty_set, clinic_created } = data;
    const decodedUser = jwtDecode(token);
    
    if (decodedUser) {
        const currentUser: User = {
            id: decodedUser.user_id,
            name: decodedUser.name,
            email: decodedUser.email,
            role: decodedUser.role,
            avatarUrl: `https://placehold.co/32x32.png`,
            reset_initial_password: reset_initial_password,
            specialty_set: specialty_set,
            clinic_created: clinic_created,
        };
        setAuthToken(token);
        setUser(currentUser);
        saveStateToStorage(currentUser, token);
        // The withAuth HOC will handle redirection based on the new state
    } else {
        throw new Error("Failed to decode token after login.");
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setAuthToken(null);
    router.replace('/');
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
