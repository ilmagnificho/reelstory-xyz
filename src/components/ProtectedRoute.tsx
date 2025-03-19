import { useContext, useEffect } from 'react';
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
  '/dashboard' // Allow dashboard access for development
];

// Development mode flag - allows bypassing authentication for testing
const DEV_MODE = process.env.NODE_ENV === 'development';

// Check if a route is an admin route
const isAdminRoute = (path: string) => {
  return path.startsWith('/admin');
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initializing } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // Skip during initial loading or if in development mode
    if (initializing || DEV_MODE) return;
    
    // If user is not logged in and trying to access a protected route
    if (!user && !publicRoutes.includes(router.pathname)) {
      console.log('User not authenticated, redirecting to login');
      // Save the intended destination for redirect after login
      const redirectPath = encodeURIComponent(router.asPath);
      router.push(`/login?redirect=${redirectPath}`);
    }
    
    // Admin routes are handled separately in their respective pages
    // This prevents redirect loops by not handling admin authorization here
  }, [user, initializing, router]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // For public routes, authenticated users, or dev mode, render children
  if (DEV_MODE || user || publicRoutes.includes(router.pathname)) {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedRoute;