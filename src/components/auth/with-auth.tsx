
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

      const isAuthPage = pathname === '/';
      const isChangePasswordPage = pathname === '/dashboard/change-password';

      if (user) {
        // If the user is logged in, check for required onboarding steps or access control.
        if (user.reset_initial_password && !isChangePasswordPage) {
          router.replace('/dashboard/change-password');
          return;
        }

        if (isAuthPage) {
          router.replace('/dashboard');
          return;
        }
        
        if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
          router.replace('/not-found');
          return;
        }
      } else {
        // If no user, redirect to login page if they aren't already there.
        if (!isAuthPage) {
          router.replace('/');
          return;
        }
      }
    }, [user, isLoading, router, pathname, requiredRoles]);

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

    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;
