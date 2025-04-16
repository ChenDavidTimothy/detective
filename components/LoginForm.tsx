import { useState, useEffect, useRef, useCallback } from 'react';
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
  error 
}: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [debouncedEmail, setDebouncedEmail] = useState('');
  
  // Add refs to help detect autocomplete
  const mountTimeRef = useRef(Date.now());
  const isAutocompleteChange = useRef(false);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Immediate email checking function for autocomplete
  const checkEmailImmediately = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || !isSignUp || !isValidEmail(emailToCheck)) return;
    
    try {
      setIsCheckingEmail(true);
      
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToCheck.trim() }),
      });
      
      // Safe response handling with multiple safeguards
      if (!response.ok) return;
      
      try {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return;
        }
        
        const data = await response.json();
        
        if (data.exists) {
          let errorMsg = 'This email is already registered. Please sign in instead.';
          if (data.provider === 'google') {
            errorMsg += ' You previously signed up with Google.';
          }
          setLocalError(errorMsg);
        }
      } catch (err) {
        // Silent fail for parsing errors
        console.error('Response parsing error:', err);
      }
    } catch (err) {
      console.error('Immediate email check error:', err);
    } finally {
      setIsCheckingEmail(false);
    }
  }, [isSignUp]);

  // Add debounce effect for email input
  useEffect(() => {
    if (!isSignUp) return; // Only check in signup mode
    
    // Skip the check if we think this is from autocomplete
    if (isAutocompleteChange.current) {
      isAutocompleteChange.current = false;
      return;
    }
    
    const handler = setTimeout(() => {
      // Only check valid emails and avoid checking empty or invalid emails
      if (email && isValidEmail(email)) {
        setDebouncedEmail(email);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [email, isSignUp]);

  // Add email checking effect with improved error handling
  useEffect(() => {
    const checkEmailExists = async () => {
      if (!debouncedEmail || !isSignUp || !isValidEmail(debouncedEmail)) return;
      
      try {
        setIsCheckingEmail(true);
        setLocalError(null); // Clear previous errors
        
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: debouncedEmail.trim() }),
        });
        
        // Check if response is actually JSON before trying to parse it
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response received');
          setIsCheckingEmail(false);
          return;
        }
        
        if (!response.ok) {
          console.error('Email check failed with status:', response.status);
          setIsCheckingEmail(false);
          return;
        }
        
        try {
          const data = await response.json();
          
          if (data.exists) {
            let errorMsg = 'This email is already registered. Please sign in instead.';
            
            if (data.provider === 'google') {
              errorMsg += ' You previously signed up with Google.';
            }
            
            setLocalError(errorMsg);
          }
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
        }
      } catch (err) {
        console.error('Email check error:', err);
      } finally {
        setIsCheckingEmail(false);
      }
    };
    
    checkEmailExists();
  }, [debouncedEmail, isSignUp]);

  // Update handleSubmit to check for local errors and validate
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    if (!isValidEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    
    // Prevent submission if there's a local error
    if (localError) {
      return;
    }
    
    setLocalError(null);
    await onSubmit(email.trim(), password, isSignUp);
  };

  // Function to render error message
  const renderError = () => {
    const displayError = localError || error;
    if (!displayError) return null;
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          {displayError}
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
                  // Detect if this is likely an autocomplete event
                  isAutocompleteChange.current = 
                    Date.now() - mountTimeRef.current < 100 || 
                    (e.target.value.includes('@') && email.length === 0);
                  
                  setEmail(e.target.value);
                  setLocalError(null);
                }}
                onFocus={() => {
                  isAutocompleteChange.current = false;
                }}
                onBlur={() => {
                  if (isAutocompleteChange.current && isSignUp && isValidEmail(email)) {
                    checkEmailImmediately(email);
                  }
                }}
                placeholder="Email address"
                disabled={isLoading}
                className={localError && localError.includes('email') ? 'border-destructive' : ''}
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
                setLocalError(null);
              }}
              className="text-sm p-0 h-auto"
              disabled={isLoading}
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}