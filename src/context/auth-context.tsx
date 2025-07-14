"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  getAuthToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        const decodedUser = jwtDecode(storedToken);
        if (decodedUser) {
            setUser({
                id: decodedUser.user_id,
                name: decodedUser.name,
                email: decodedUser.email,
                role: decodedUser.role,
                avatarUrl: `https://placehold.co/32x32.png`
            });
            setAuthToken(storedToken);
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth state", error)
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
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
    const { access: token } = data;
    
    const decodedUser = jwtDecode(token);
    if (decodedUser) {
        const userPayload: User = {
            id: decodedUser.user_id,
            name: decodedUser.name,
            email: decodedUser.email,
            role: decodedUser.role,
            avatarUrl: `https://placehold.co/32x32.png`
        };
        setUser(userPayload);
        setAuthToken(token);
        localStorage.setItem('authToken', token);
    } else {
        throw new Error("Failed to decode token");
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
  };

  const getAuthToken = () => {
    return authToken;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, getAuthToken }}>
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
