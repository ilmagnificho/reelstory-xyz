import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/util/supabase/component'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()
  const { createUser } = useAuth(); // 올바른 위치에서 훅 사용

  useEffect(() => {
    const handleAuthStateChange = async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await createUser(session.user);
          router.push('/dashboard');
        } catch (error) {
          console.error('Error creating user:', error);
          router.push('/error');
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      authListener.subscription.unsubscribe();
    }
  }, [router, createUser, supabase.auth]);

  return null
}