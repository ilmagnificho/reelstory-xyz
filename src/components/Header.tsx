import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';

const Header = () => {
  const { user, initializing, signOut } = useContext(AuthContext);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user) return;

    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/check-admin', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleButtonClick = () => {
    if (user && router.pathname === '/dashboard') {
      signOut();
      router.push('/');
    } else {
      router.push(user ? "/dashboard" : "/login");
    }
  };

  const buttonText = () => {
    if (user && router.pathname === '/dashboard') {
      return "Log out";
    }
    return user ? "Dashboard" : "Login";
  };

  return (
    <header className="w-full">
      <div className="flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
        <div className="cursor-pointer" onClick={() => router.push("/")}>
          <Logo />
        </div>
        {!initializing && (
          <div className="flex items-center space-x-4">
            {user && isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    관리자 <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/admin/upload')}>
                    비디오 업로드
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button 
              onClick={handleButtonClick}
              variant="default"
              size="default"
            >
              {buttonText()}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;