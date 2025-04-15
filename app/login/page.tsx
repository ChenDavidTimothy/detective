'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { normalizeAuthError, type NormalizedAuthError } from '@/utils/auth-helpers';

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const [error, setError] = useState<NormalizedAuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (errorParam === 'unknown') {
      setError({
        type: 'unknown',
        message: "An error occurred during authentication. Please try again."
      });
    }
  }, [errorParam]);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    } else {
      setIsLoading(false);
    }
  }, [user, router]);

  const handleSubmit = async (email: string, password: string, isSignUp: boolean) => {
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email, password);
        if (error) {
          setError(error);
          setIsLoading(false);
          return;
        }
        if (data?.user && !data.user.email_confirmed_at) {
          router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        router.replace('/dashboard');
      } else {
        try {
          await signInWithEmail(email, password);
          router.replace('/dashboard');
        } catch (error) {
          setError(
            error as NormalizedAuthError ||
            normalizeAuthError('Authentication failed')
          );
          setIsLoading(false);
        }
      }
    } catch (error) {
      setError(normalizeAuthError(error));
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      setError(normalizeAuthError(error));
      setIsLoading(false);
    }
  };

  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 pt-16 pb-10">
      <div className="w-full max-w-md">
        <LoginForm
          onSubmit={handleSubmit}
          onGoogleSignIn={handleGoogleSignIn}
          isLoading={isLoading}
          error={error || undefined}
        />
      </div>
    </div>
  );
}
