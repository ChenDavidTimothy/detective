// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { login, signup } from './actions';
import { signInWithGoogle } from '@/utils/supabase/auth-actions';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  const [error, setError] = useState<{type?: string; message: string} | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  // Handle URL error parameters
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      let errorMessage = "Authentication error occurred";
      let errorType = "unknown";
      
      switch (errorParam) {
        case 'auth_callback_error':
          errorMessage = "Authentication failed. Please try again.";
          break;
        case 'password_reset_expired':
          errorMessage = "Password reset link has expired. Please request a new one.";
          errorType = "expired-token";
          break;
        case 'verification_failed':
          errorMessage = "Email verification failed. Please request a new verification email.";
          errorType = "email-not-verified";
          break;
      }
      
      setError({ type: errorType, message: errorMessage });
    }
  }, [searchParams]);

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
        setError(result.error);
        setIsLoading(false);
      } else {
        // CHANGE: Force a full page refresh by using window.location
        // This ensures all components re-render with the latest auth state
        window.location.href = result?.redirectTo || returnTo;
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError({
        message: err instanceof Error ? err.message : 'An unexpected error occurred'
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle(returnTo);
      // No need to redirect manually - OAuth flow handles this
    } catch (err) {
      console.error('Google sign in error:', err);
      setError({
        type: 'google-auth-error',
        message: err instanceof Error ? err.message : 'Google sign in failed'
      });
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