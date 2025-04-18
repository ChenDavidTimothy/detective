'use client'

import { useState, useEffect, useRef } from 'react';
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

interface LoginFormProps {
  onSubmit: (
    email: string,
    password: string,
    isSignUp: boolean
  ) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: string;
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
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const autocompleteRef = useRef(false);

  useEffect(() => {
    if (!isSignUp || !isValidEmail(email)) return;

    let cancelled = false;
    setLocalError(null);

    async function check() {
      setIsCheckingEmail(true);
      try {
        const resp = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        if (!resp.ok) return;
        const ct = resp.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return;

        const data = await resp.json();
        if (data.exists && !cancelled) {
          let msg = 'This email is already registered. Please sign in instead.';
          if (data.provider === 'google') {
            msg += ' You previously signed up with Google.';
          }
          setLocalError(msg);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsCheckingEmail(false);
      }
    }

    if (autocompleteRef.current) {
      autocompleteRef.current = false;
      check();
    } else {
      const timer = setTimeout(check, 500);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [email, isSignUp]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (localError) return;
    setLocalError(null);
    await onSubmit(email.trim(), password, isSignUp);
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-3xl">🎬</span>
          <CardTitle className="text-2xl font-medium">NextTemp</CardTitle>
        </div>
        {(localError || error) && (
          <Alert variant={error?.includes('Google') ? "default" : "destructive"} className="mb-4">
            <AlertDescription>
              {localError || error}
              {error?.includes('No account found') && (
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
            {isSignUp ? 'Create an account' : 'Are you an Email User?'}
          </CardTitle>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  // autocomplete detection
                  autocompleteRef.current =
                    email.length === 0 && e.target.value.includes('@');
                  setEmail(e.target.value);
                  setLocalError(null);
                }}
                onFocus={() => {
                  autocompleteRef.current = false;
                }}
                placeholder="Email address"
                disabled={isLoading}
                className={
                  localError && localError.includes('email')
                    ? 'border-destructive'
                    : ''
                }
              />
              {isCheckingEmail && (
                <div className="text-xs text-muted-foreground flex items-center">
                  <div className="animate-spin mr-1 h-3 w-3 border-t-2 border-primary rounded-full"></div>
                  Checking email...
                </div>
              )}
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError(null);
              }}
              placeholder="Password"
              disabled={isLoading}
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
              'Sign up '
            ) : (
              'Sign in '
            )}
            with Email
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setLocalError(null);
              }}
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
