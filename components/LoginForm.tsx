import { useState, useEffect, useRef } from 'react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginFormProps {
  onSubmit: (email: string, password: string, isSignUp: boolean) => Promise<void>;
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

  // Used to detect autocomplete events
  const autocompleteRef = useRef(false);

  const isValidEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Unified email checking with debounce and autocomplete support
  useEffect(() => {
    if (!isSignUp || !isValidEmail(email)) return;

    let cancelled = false;
    setLocalError(null);

    const check = async () => {
      setIsCheckingEmail(true);
      try {
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });

        if (
          !response.ok ||
          !response.headers.get('content-type')?.includes('application/json')
        )
          return;

        const data = await response.json();
        if (data.exists) {
          let msg = 'This email is already registered. Please sign in instead.';
          if (data.provider === 'google') {
            msg += ' You previously signed up with Google.';
          }
          if (!cancelled) setLocalError(msg);
        }
      } catch (err) {
        // Silent fail
      } finally {
        if (!cancelled) setIsCheckingEmail(false);
      }
    };

    // If triggered by autocomplete, check immediately; else debounce
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (localError) return;
    setLocalError(null);
    await onSubmit(email.trim(), password, isSignUp);
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-3xl">🎬</span>
          <CardTitle className="text-2xl font-medium">NextTemp</CardTitle>
        </div>
        {(localError || error) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{localError || error}</AlertDescription>
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
                  // Heuristic: if input is empty and new value contains '@', likely autocomplete
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
              'Sign up'
            ) : (
              'Sign in'
            )}{' '}
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
