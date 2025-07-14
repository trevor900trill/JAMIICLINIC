"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'doctor' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<string, User> = {
    'admin@example.com': { id: 'user-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', avatarUrl: 'https://placehold.co/32x32.png' },
    'doctor@example.com': { id: 'user-2', name: 'Dr. Emily White', email: 'doctor@example.com', role: 'doctor', avatarUrl: 'https://placehold.co/32x32.png' },
    'staff@example.com': { id: 'user-3', name: 'John Smith', email: 'staff@example.com', role: 'staff', avatarUrl: 'https://placehold.co/32x32.png' },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error)
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
     return new Promise((resolve, reject) => {
        const foundUser = mockUsers[email.toLowerCase()];
        if (foundUser && pass.length >= 6) {
          setUser(foundUser);
          localStorage.setItem('user', JSON.stringify(foundUser));
          resolve();
        } else {
          reject(new Error('Invalid credentials'));
        }
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
