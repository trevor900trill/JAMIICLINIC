
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
  specialty?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  getAuthToken: () => string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A new endpoint to get full user details, which is not in the provided swagger.
// We are assuming its existence for the specialty flow.
const fetchUserDetails = async (token: string): Promise<User | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/me/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return null;
        const data = await response.json();
        const decodedToken = jwtDecode(token);

        return {
            id: decodedToken.user_id,
            name: data.name || decodedToken.name,
            email: data.email,
            role: data.role,
            specialty: data.specialty, // This is the key field we need
            avatarUrl: `https://placehold.co/32x32.png`,
            reset_initial_password: localStorage.getItem('reset_initial_password') === 'true',
        };
    } catch {
        return null;
    }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        setIsLoading(true);
        const userDetails = await fetchUserDetails(token);
        if (userDetails) {
            setUser(userDetails);
        }
        setIsLoading(false);
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          setAuthToken(storedToken);
          const userDetails = await fetchUserDetails(storedToken);
          if (userDetails) {
              setUser(userDetails);
          } else {
             // Fallback to JWT if /me fails
             const decodedUser = jwtDecode(storedToken);
             if(decodedUser) {
                setUser({
                    id: decodedUser.user_id,
                    name: decodedUser.name,
                    email: decodedUser.email,
                    role: decodedUser.role,
                    avatarUrl: `https://placehold.co/32x32.png`,
                    reset_initial_password: localStorage.getItem('reset_initial_password') === 'true'
                })
             }
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
    
    // Store reset_password flag before fetching full details
    if (reset_initial_password) {
        localStorage.setItem('reset_initial_password', 'true');
    } else {
        localStorage.removeItem('reset_initial_password');
    }

    const userDetails = await fetchUserDetails(token);
    
    if (userDetails) {
        setUser(userDetails);
        if (userDetails.reset_initial_password) {
            router.push('/dashboard/change-password');
        } else if (userDetails.role === 'doctor' && !userDetails.specialty) {
            router.push('/dashboard/set-specialty');
        } else {
            router.push('/dashboard');
        }
    } else {
        throw new Error("Failed to fetch user details after login.");
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
