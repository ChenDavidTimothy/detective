// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login, signup, signInWithGoogle } from './actions';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const handleSubmit = async (
    email: string,
    password: string,
    isSignUp: boolean
  ) => {
    setError(undefined);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('returnTo', returnTo);

      const result = isSignUp
        ? await signup(formData)
        : await login(formData);

      if (result?.error) {
        setError(result.error.message);
        setIsLoading(false);
      } else {
        window.location.href = result?.redirectTo || returnTo;
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // With the new implementation, signInWithGoogle doesn't return 
      // a data object with a URL - it redirects automatically
      await signInWithGoogle(returnTo);
      
      // No need to manually redirect with window.location.href
      // The redirect happens automatically via Supabase
      
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false); // Only reset loading on error
    }
    
    // Note: We don't need the finally block to reset isLoading
    // because the page will redirect on success, so this component unmounts
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 pt-16 pb-10">
      <div className="w-full max-w-md">
        <LoginForm
          onSubmit={handleSubmit}
          onGoogleSignIn={handleGoogleSignIn}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}