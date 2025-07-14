
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
        setUser(storedUser);
        setAuthToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isOnboardingRoute = ONBOARDING_ROUTES.includes(pathname);
    
    if (user) {
      // Highest priority: If password change is required, force it.
      if (user.reset_initial_password && pathname !== '/change-password') {
        router.replace('/change-password');
        return;
      }
      
      // If password is fine, but they are a doctor who hasn't set a specialty
      if (!user.reset_initial_password && user.role === 'doctor' && !user.specialty_set && pathname !== '/set-specialty') {
        router.replace('/set-specialty');
        return;
      }

      // If user is fully onboarded and tries to access login page, redirect to dashboard.
      if (!user.reset_initial_password && isPublicRoute) {
         router.replace('/dashboard');
      }

    } else {
      // If no user, redirect to login from any protected route
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
  
  const skipOnboardingStep = async (step: 'clinic_created' | 'staff_created') => {
    await refreshUser({ [step]: true });
    // After skipping, AuthProvider's useEffect will handle the next redirect
    if (step === 'clinic_created') {
        router.push('/onboarding/create-staff');
    } else {
        router.push('/dashboard');
    }
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
        const { access: token, user: userData } = data;
        
        if (userData && token) {
            const currentUser: User = {
                id: userData.id,
                name: `${userData.first_name} ${userData.last_name}`,
                email: userData.email,
                role: userData.role,
                avatarUrl: `https://placehold.co/32x32.png`,
                reset_initial_password: userData.reset_initial_password,
                // These will be false from the API initially for new users
                specialty_set: false, 
                clinic_created: false,
                staff_created: false,
            };
            updateUserState(currentUser, token);
            // Redirection is now handled by the useEffect hook in this component
        } else {
            throw new Error("Login response did not contain user data or token.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear state first to prevent flash of old content
    updateUserState(null, null);
    router.replace('/');
  };

  const getAuthToken = () => {
    return authToken;
  }
  
  // This loader is for the initial app load, not for login button state
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
