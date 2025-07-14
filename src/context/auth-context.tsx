
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';
import { Loader2 } from 'lucide-react';

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
  staff_created?: boolean;
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

const safeJSONParse = (item: string | null) => {
    if (item === null) return null;
    try {
        return JSON.parse(item);
    } catch (e) {
        return null;
    }
}

const PUBLIC_ROUTES = ['/'];
const ONBOARDING_ROUTES = ['/change-password', '/set-specialty', '/onboarding/create-clinic', '/onboarding/create-staff'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const updateUserState = (newUser: User | null, newToken: string | null) => {
    setUser(newUser);
    setAuthToken(newToken);
    if (typeof window !== 'undefined') {
        if (newUser && newToken) {
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    }
  }
  
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = safeJSONParse(localStorage.getItem('user'));
    if (storedToken && storedUser) {
        setUser(storedUser);
        setAuthToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (user) {
        // 1. Highest priority: Force password change if needed.
        if (user.reset_initial_password && pathname !== '/change-password') {
            router.replace('/change-password');
            return;
        }
        
        // 2. Second priority: Force specialty set for doctors if needed.
        if (!user.reset_initial_password && user.role === 'doctor' && !user.specialty_set && pathname !== '/set-specialty') {
            router.replace('/set-specialty');
            return;
        }

        // 3. If logged in and on a public page, redirect to dashboard.
        if (isPublicRoute) {
            router.replace('/dashboard');
        }
    } else {
      // 4. If not logged in and not on a public page, redirect to login.
      if (!isPublicRoute) {
        router.replace('/');
      }
    }

  }, [user, isLoading, pathname, router]);
  
  const refreshUser = async (updates: Partial<User>) => {
    const updatedUser = user ? { ...user, ...updates } : null;
    updateUserState(updatedUser, authToken);
    return Promise.resolve();
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
    const { access: token, user: userData } = data;
    
    if (userData && token) {
        const currentUser: User = {
            id: userData.id,
            name: `${userData.first_name} ${userData.last_name}`,
            email: userData.email,
            role: userData.role,
            avatarUrl: `https://placehold.co/32x32.png`,
            reset_initial_password: userData.reset_initial_password,
            specialty_set: userData.specialty_set ?? true,
            clinic_created: false,
            staff_created: false,
        };
        updateUserState(currentUser, token);
    } else {
        throw new Error("Login response did not contain user data or token.");
    }
  };

  const logout = () => {
    router.push('/');
    updateUserState(null, null);
  };

  const getAuthToken = () => {
    return authToken;
  }
  
  const protectedRoutes = !PUBLIC_ROUTES.includes(pathname) && !ONBOARDING_ROUTES.includes(pathname);

  if (isLoading || (protectedRoutes && !user)) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
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
