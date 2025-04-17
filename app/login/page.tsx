'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login, signup } from './actions';
import { signInWithGoogle } from '@/utils/supabase/auth-actions';
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
      await signInWithGoogle(returnTo);
      // No need to redirect manually or handle response - the OAuth flow 
      // will handle the redirect automatically
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
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