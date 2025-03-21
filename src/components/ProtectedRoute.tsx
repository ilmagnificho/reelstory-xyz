import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';

// Define public routes that don't require authentication
const publicRoutes = [
  '/', 
  '/login', 
  '/signup', 
  '/forgot-password', 
  '/magic-link-login',
  '/videos', // New public route for video browsing
  '/dashboard', // Allow dashboard access for development
  '/auth/callback', // Add callback route to prevent redirect loops
  '/error' // Error page
];

// Development mode flag - allows bypassing authentication for testing
const DEV_MODE = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_CO_DEV_ENV === 'preview';

// Check if a route is an admin route
const isAdminRoute = (path: string) => {
  return path.startsWith('/admin');
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initializing } = useContext(AuthContext);
  const router = useRouter();
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Skip during initial loading
    if (initializing) return;
    
    // Prevent redirect loops by checking if we've already attempted a redirect
    if (redirectAttempted) return;
    
    // If user is not logged in and trying to access a protected route
    if (!user && !publicRoutes.includes(router.pathname) && !router.pathname.includes('/auth/')) {
      console.log('User not authenticated, redirecting to login');
      
      // Save the intended destination for redirect after login
      const redirectPath = encodeURIComponent(router.asPath);
      setRedirectAttempted(true);
      
      // For admin routes, we need to ensure the redirect is properly handled
      if (isAdminRoute(router.pathname)) {
        console.log('Admin route detected, setting specific redirect');
        router.push(`/login?redirect=${redirectPath}`);
      } else {
        router.push(`/login?redirect=${redirectPath}`);
      }
    }
    
    // Admin routes are handled separately in their respective pages
    // This prevents redirect loops by not handling admin authorization here
  }, [user, initializing, router, redirectAttempted]);

  // Reset redirect flag when route changes
  useEffect(() => {
    setRedirectAttempted(false);
  }, [router.pathname]);

  // Show loading state during initialization
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // For public routes, authenticated users, or dev mode, render children
  if (DEV_MODE || user || publicRoutes.includes(router.pathname) || router.pathname.includes('/auth/')) {
    return <>{children}</>;
  }

  // If we're in a redirect state, show loading
  if (redirectAttempted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return null;
};

export default ProtectedRoute;