
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
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      // Don't do anything while auth state is loading
      if (isLoading) {
        return;
      }

      const isAuthPage = pathname === '/';

      // If user is logged in
      if (user) {
        // If they are on the login page, redirect them to the dashboard
        if (isAuthPage) {
          router.replace('/dashboard');
          return;
        }
        
        // Handle role-based access for protected routes
        if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
          router.replace('/not-found');
          return;
        }
      } else {
        // If no user is logged in, and they are not on the login page,
        // redirect them to the login page.
        if (!isAuthPage) {
          router.replace('/');
          return;
        }
      }
    }, [user, isLoading, router, pathname, requiredRoles]);

    // Show a global loading spinner while we determine auth state
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    // Prevent rendering protected pages if user is not authenticated yet.
    if (!user && pathname !== '/') {
        return null;
    }
    
    // Prevent rendering the login page if the user is already logged in (and redirect is in progress).
    if (user && pathname === '/') {
        return null;
    }

    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;
