// components/LoginForm.tsx
'use client'

import { useState } from 'react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginFormProps {
  onSubmit: (
    email: string,
    password: string,
    isSignUp: boolean
  ) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: {
    type?: string;
    message: string;
  };
}

export function LoginForm({
  onSubmit,
  onGoogleSignIn,
  isLoading,
  error,
}: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      return; // Form has required attributes, so browser will handle this
    }
    
    await onSubmit(email.trim(), password, isSignUp);
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-3xl">🔍</span>
          <CardTitle className="text-2xl font-medium">Detective Cases</CardTitle>
        </div>
        
        {/* Only show error after submission */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {error.message}
              
              {/* Suggest sign up if account not found */}
              {error.type === 'invalid-credentials' && 
                error.message.includes('No account found') && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsSignUp(true)}
                    className="text-sm p-0 h-auto"
                    disabled={isLoading}
                  >
                    Click here to sign up
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          onClick={onGoogleSignIn}
          variant="outline"
          className="w-full"
          type="button"
          disabled={isLoading}
        >
          <Image
            src="/Google-Logo.png"
            alt="Google Logo"
            width={20}
            height={20}
            className="mr-2"
          />
          Sign in with Google
        </Button>

        <div className="flex items-center justify-center my-6 w-full px-4">
          <Separator className="w-full flex-1 h-px bg-muted-foreground" />
          <span className="mx-4 text-sm text-muted-foreground">OR</span>
          <Separator className="w-full flex-1 h-px bg-muted-foreground" />
        </div>

        <div className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? 'Create an account' : 'Sign in with email'}
          </CardTitle>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              disabled={isLoading}
              required
            />
            
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={isLoading}
              required
              minLength={6}
            />
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-sm p-0 h-auto"
                disabled={isLoading}
              >
                Forgot your password?
              </Button>
            </div>
          )}

          <ForgotPasswordModal
            isOpen={isForgotPasswordOpen}
            onClose={() => setIsForgotPasswordOpen(false)}
          />

          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full"
          >
            {isLoading ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                {isSignUp ? 'Signing up...' : 'Signing in...'}
              </span>
            ) : isSignUp ? (
              'Sign up'
            ) : (
              'Sign in'
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm p-0 h-auto"
              disabled={isLoading}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : 'Need an account? Sign up'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}