
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
      if (isLoading) {
        return; 
      }

      // If no user is logged in, and we are not on the login page, redirect to the login page.
      if (!user && pathname !== '/') {
        router.replace('/');
        return;
      }
      
      // If a user IS logged in and is on the login page, redirect to the dashboard.
      if (user && pathname === '/') {
        router.replace('/dashboard');
        return;
      }
      
      // Role-based access control for protected dashboard routes
      if (user && requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        router.replace('/not-found');
        return;
      }

    }, [user, isLoading, router, pathname, requiredRoles]);

    // Show a loading spinner while authentication state is being determined
    if (isLoading) {
       return (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }
    
    // Prevent rendering of protected pages if user is not authenticated yet.
    if (!user && pathname !== '/') {
        return null;
    }
    
    // Prevent rendering of the login page if the user is already logged in.
    if (user && pathname === '/') {
        return null;
    }

    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;
