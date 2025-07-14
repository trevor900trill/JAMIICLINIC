
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

// Helper to decode JWT. NOTE: This is a simple, unsafe decode for payload data.
// It does NOT verify the token signature. Verification should happen on the server.
const jwtDecode = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export type UserRole = 'admin' | 'doctor' | 'staff';

export interface User {
  id: string; // From token 'user_id'
  name: string; // From token 'name'
  email: string; // From token 'email'
  role: UserRole; // From token 'role'
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

  const refreshUser = async (updates: Partial<User>) => {
    const updatedUser = { ...user, ...updates } as User;
    
    // Persist onboarding state to localStorage
    if (updates.hasOwnProperty('reset_initial_password')) {
       localStorage.setItem('reset_initial_password', String(updates.reset_initial_password));
    }
    if (updates.hasOwnProperty('specialty_set')) {
       localStorage.setItem('specialty_set', String(updates.specialty_set));
    }
    if (updates.hasOwnProperty('clinic_created')) {
        localStorage.setItem('clinic_created', String(updates.clinic_created));
    }
    if (updates.hasOwnProperty('new_clinic_id')) {
        localStorage.setItem('new_clinic_id', String(updates.new_clinic_id));
    }
    
    setUser(updatedUser);
    return Promise.resolve();
  }

  useEffect(() => {
    const initializeAuth = () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          const decodedUser = jwtDecode(storedToken);
          if (decodedUser) {
            setAuthToken(storedToken);
            setUser({
              id: decodedUser.user_id,
              name: decodedUser.name,
              email: decodedUser.email,
              role: decodedUser.role,
              avatarUrl: `https://placehold.co/32x32.png`,
              reset_initial_password: localStorage.getItem('reset_initial_password') === 'true',
              specialty_set: localStorage.getItem('specialty_set') === 'true',
              clinic_created: localStorage.getItem('clinic_created') === 'true',
              new_clinic_id: Number(localStorage.getItem('new_clinic_id')) || null
            });
          } else {
             logout();
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth state", error)
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: pass }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    const { access: token, reset_initial_password, specialty_set } = data;

    localStorage.setItem('authToken', token);
    localStorage.setItem('reset_initial_password', String(reset_initial_password));
    localStorage.setItem('specialty_set', String(specialty_set));
    localStorage.removeItem('clinic_created');
    localStorage.removeItem('new_clinic_id');

    setAuthToken(token);

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
            clinic_created: false, // Reset on login
        };
        // This is the key change: we set the user and then let withAuth handle redirection.
        // The router.push is removed from here to prevent the race condition.
        setUser(currentUser);
        
    } else {
        logout(); // If token is invalid, log out
        throw new Error("Failed to decode token after login.");
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('reset_initial_password');
    localStorage.removeItem('specialty_set');
    localStorage.removeItem('clinic_created');
    localStorage.removeItem('new_clinic_id');
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
