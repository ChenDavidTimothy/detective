'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { normalizeAuthError, type NormalizedAuthError } from '@/utils/auth-helpers';

interface LoginFormProps {
  onSubmit: (email: string, password: string, isSignUp: boolean) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: NormalizedAuthError | string;
}

export function LoginForm({ 
  onSubmit, 
  onGoogleSignIn, 
  isLoading, 
  error 
}: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { checkEmailExists } = useAuth();
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [localError, setLocalError] = useState<NormalizedAuthError | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (isSignUp) {
      // For signup, check if email exists first
      setIsCheckingEmail(true);
      try {
        const { exists, provider } = await checkEmailExists(email);
        if (exists) {
          setLocalError({
            type: 'email-already-exists',
            message: provider === 'google'
              ? "This email is already used with Google Sign In. Please use Google to sign in."
              : "This email is already registered. Please sign in instead."
          });
          setIsCheckingEmail(false);
          return;
        }
      } catch (error) {
        console.error("Error checking email:", error);
      } finally {
        setIsCheckingEmail(false);
      }
    }
    
    await onSubmit(email, password, isSignUp);
  };

  // Function to render error message with appropriate action button
  const renderError = () => {
    // Use local error or passed error
    const displayError = localError || (error ? (typeof error === 'string' 
      ? normalizeAuthError(error) 
      : error) : null);
    
    if (!displayError) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription className="flex flex-col gap-2">
          <span>{displayError.message}</span>
          
          {displayError.type === 'email-already-exists' && (
            <div className="flex justify-end">
              {displayError.message.includes('Google') ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onGoogleSignIn}
                  size="sm"
                >
                  Sign in with Google
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSignUp(false);
                    setLocalError(null);
                  }}
                  size="sm"
                >
                  Go to Sign In
                </Button>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-3xl">🎬</span>
          <CardTitle className="text-2xl font-medium">
            NextTemp
          </CardTitle>
        </div>
        {renderError()}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button
          onClick={onGoogleSignIn}
          variant="outline"
          className="w-full"
          type="button"
          disabled={isLoading || isCheckingEmail}
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
            {isSignUp ? 'Create an account' : 'Are you an Email User?'}
          </CardTitle>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLocalError(null); // Clear error when email changes
              }}
              placeholder="Email address"
              disabled={isLoading || isCheckingEmail}
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError(null); // Clear error when password changes
              }}
              placeholder="Password"
              disabled={isLoading || isCheckingEmail}
            />
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-sm p-0 h-auto"
                disabled={isLoading || isCheckingEmail}
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
            disabled={isLoading || isCheckingEmail || !email || !password}
            className="w-full"
          >
            {isCheckingEmail ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Checking...
              </span>
            ) : isLoading ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                {isSignUp ? 'Signing up...' : 'Signing in...'}
              </span>
            ) : (
              isSignUp ? 'Sign up' : 'Sign in'
            )} with Email
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setLocalError(null); // Clear errors when switching modes
              }}
              className="text-sm p-0 h-auto"
              disabled={isLoading || isCheckingEmail}
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}