"use client"

import React, { ComponentType, useEffect } from 'react';
import { useAuth, UserRole } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const withAuth = <P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredRoles?: UserRole[]
) => {
  const AuthComponent = (props: P) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          router.replace('/');
          return;
        }

        if (requiredRoles && requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.includes(user.role);
          if (!hasRequiredRole) {
            router.replace('/not-found');
          }
        }
      }
    }, [user, isLoading, router, requiredRoles]);

    if (isLoading || !user) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
       return null; // or a loading/access denied component, handled by redirect
    }

    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;
