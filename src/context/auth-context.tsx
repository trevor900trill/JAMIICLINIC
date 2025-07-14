
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
  specialty_set?: boolean; // Doctor onboarding
  clinic_created?: boolean;  // Doctor onboarding
  staff_created?: boolean;   // Doctor onboarding
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  getAuthToken: () => string | null;
  refreshUser: (updates: Partial<User>) => Promise<void>;
  skipOnboardingStep: (step: 'clinic_created' | 'staff_created') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const safeJSONParse = (item: string | null) => {
    if (item === null) return null;
    try {
        return JSON.parse(item);
    } catch (e) {
        return null;
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadStateFromStorage = () => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = safeJSONParse(localStorage.getItem('user'));

      if (storedToken && storedUser) {
        setAuthToken(storedToken);
        setUser(storedUser);
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
  
  const saveStateToStorage = (userState: User | null, token: string | null) => {
      if (userState && token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userState));
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
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
  
  const skipOnboardingStep = async (step: 'clinic_created' | 'staff_created') => {
      await refreshUser({ [step]: true });
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
    const { access: token, reset_initial_password, specialty_set, clinic_created, staff_created } = data;
    const decodedUser = jwtDecode(token);
    
    if (decodedUser) {
        const currentUser: User = {
            id: decodedUser.user_id,
            name: decodedUser.name,
            email: decodedUser.email,
            role: decodedUser.role,
            avatarUrl: `https://placehold.co/32x32.png`,
            reset_initial_password: reset_initial_password,
            // Initialize doctor onboarding state from API or default to false
            specialty_set: specialty_set || false,
            clinic_created: clinic_created || false,
            staff_created: staff_created || false,
        };
        setAuthToken(token);
        setUser(currentUser);
        saveStateToStorage(currentUser, token);
        
        if (reset_initial_password) {
            router.push('/change-password');
        } else if (currentUser.role === 'doctor' && !currentUser.specialty_set) {
            router.push('/set-specialty');
        } else {
            router.push('/dashboard');
        }
    } else {
        throw new Error("Failed to decode token after login.");
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    saveStateToStorage(null, null); // Clear storage
    router.push('/');
  };

  const getAuthToken = () => {
    return authToken;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, getAuthToken, refreshUser, skipOnboardingStep }}>
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
