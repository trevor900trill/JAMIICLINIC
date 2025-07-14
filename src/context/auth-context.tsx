
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';
import { Loader2 } from 'lucide-react';

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
  staff_created?: boolean;
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
        updateUserState(storedUser, storedToken);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isPublicPage = PUBLIC_ROUTES.includes(pathname);
    const isOnboardingPage = ONBOARDING_ROUTES.includes(pathname);
    
    if (!user) {
        if (!isPublicPage) {
            router.replace('/');
        }
        return;
    }

    // User is logged in, handle redirects
    if (user.reset_initial_password) {
        if (pathname !== '/change-password') {
            router.replace('/change-password');
        }
        return;
    }

    if (user.role === 'doctor') {
        if (!user.specialty_set) {
            if (pathname !== '/set-specialty') {
                router.replace('/set-specialty');
            }
            return;
        }
        if (!user.clinic_created) {
            if (pathname !== '/onboarding/create-clinic') {
                router.replace('/onboarding/create-clinic');
            }
            return;
        }
        if (!user.staff_created) {
            if (pathname !== '/onboarding/create-staff') {
                router.replace('/onboarding/create-staff');
            }
            return;
        }
    }
    
    // If user is fully onboarded, redirect from public/onboarding pages to dashboard
    if (isPublicPage || isOnboardingPage) {
        router.replace('/dashboard');
    }

  }, [user, isLoading, pathname, router]);
  
  const refreshUser = async (updates: Partial<User>) => {
    const updatedUser = user ? { ...user, ...updates } : null;
    updateUserState(updatedUser, authToken);
    return Promise.resolve();
  }
  
  const skipOnboardingStep = async (step: 'clinic_created' | 'staff_created') => {
    await refreshUser({ [step]: true });
  }

  const login = async (email: string, pass: string): Promise<void> => {
    setIsLoading(true);
    try {
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
                specialty_set: specialty_set || false,
                clinic_created: clinic_created || false,
                staff_created: staff_created || false,
            };
            updateUserState(currentUser, token);
        } else {
            throw new Error("Failed to decode token after login.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    updateUserState(null, null);
    router.push('/');
  };

  const getAuthToken = () => {
    return authToken;
  }
  
  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
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
