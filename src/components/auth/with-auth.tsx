
"use client"

import React, { ComponentType, useEffect } from 'react';
import { useAuth, UserRole } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const withAuth = <P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredRoles?: UserRole[]
) => {
  const AuthComponent = (props: P) => {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (isLoading) {
        return; 
      }

      if (!user) {
        router.replace('/');
        return;
      }
      
      const isChangePasswordRoute = pathname === '/dashboard/change-password';
      
      // 1. Force password change (highest priority)
      if (user.reset_initial_password) {
        if (!isChangePasswordRoute) {
          router.replace('/dashboard/change-password');
        }
      // 2. If password is set, but user is trying to access change password page, redirect to dashboard
      } else if (isChangePasswordRoute) {
          router.replace('/dashboard');
      // 3. Role-based Access Control for all other routes
      } else if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        router.replace('/not-found');
      }

    }, [user, isLoading, router, pathname, requiredRoles]);


    if (isLoading || !user) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    // Prevent rendering if a redirect is imminent to avoid content flashing
    if (user.reset_initial_password && pathname !== '/dashboard/change-password') {
       return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;
