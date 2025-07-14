
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
  specialty?: string | null; // Keep for future use, but won't be populated from API for now
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  getAuthToken: () => string | null;
  refreshUser: () => Promise<void>; // Will be a no-op for now
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    // This function can be expanded later if a /me endpoint is added.
    // For now, it doesn't need to do anything as data is static from the token.
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
              specialty: null, // Specialty is unknown without a /me endpoint
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
    const { access: token, reset_initial_password } = data;

    localStorage.setItem('authToken', token);
    setAuthToken(token);
    
    if (reset_initial_password) {
        localStorage.setItem('reset_initial_password', 'true');
    } else {
        localStorage.removeItem('reset_initial_password');
    }

    const decodedUser = jwtDecode(token);
    
    if (decodedUser) {
        const currentUser: User = {
            id: decodedUser.user_id,
            name: decodedUser.name,
            email: decodedUser.email,
            role: decodedUser.role,
            avatarUrl: `https://placehold.co/32x32.png`,
            reset_initial_password: reset_initial_password,
            specialty: null, // Specialty is unknown
        };
        setUser(currentUser);

        if (currentUser.reset_initial_password) {
            router.push('/dashboard/change-password');
        } else {
            // Since we cannot check for specialty, we skip that step
            router.push('/dashboard');
        }
    } else {
        throw new Error("Failed to decode token after login.");
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('reset_initial_password');
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
