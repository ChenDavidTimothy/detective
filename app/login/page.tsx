'use client';

import { useState } from 'react';
import { login, signup, signInWithGoogle } from './actions';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

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

      const result = isSignUp
        ? await signup(formData)
        : await login(formData);

      if (result?.error) {
        setError(result.error.message);
        setIsLoading(false);
      } else {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 300);
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
      const { data, error } = await signInWithGoogle();

      if (error) {
        setError(error.message);
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
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