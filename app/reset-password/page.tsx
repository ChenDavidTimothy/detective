'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ResetPasswordContent() {
  const { supabase } = useAuth();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Using a ref to track if a reset attempt has been made
  // This persists across re-renders without triggering them
  const hasAttemptedResetRef = useRef(false);

  // Use useCallback to memoize the function and prevent unnecessary re-renders
  const handleResetPassword = useCallback(async () => {
    if (!email) return;
    
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password#`,
      });
      
      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reset email');
      
      // If there was an error, allow the user to try again
      hasAttemptedResetRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [email, supabase]); // Include all dependencies used in the function

  // Improved effect with proper dependencies including handleResetPassword
  useEffect(() => {
    // Only proceed if: 
    // 1. We have an email
    // 2. We haven't already attempted a reset
    // 3. We're not currently loading
    // 4. We haven't already succeeded
    if (email && !hasAttemptedResetRef.current && !isLoading && !success) {
      // Mark as attempted BEFORE making the async call
      hasAttemptedResetRef.current = true;
      handleResetPassword();
    }
  }, [email, isLoading, success, handleResetPassword]); // Include handleResetPassword in deps

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>
              Invalid Request
            </CardTitle>
            <CardDescription>
              No email address provided. Please try the reset password link again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>
            Reset Password
          </CardTitle>
          <CardDescription>
            Sending reset link to: <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
                <Button
                  onClick={() => {
                    hasAttemptedResetRef.current = true; // Set again before retry
                    handleResetPassword();
                  }}
                  variant="link"
                  className="ml-2 p-0 h-auto"
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {success ? (
            <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <AlertDescription className="text-green-600 dark:text-green-400">
                Reset link has been sent to your email address. Please check your inbox.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-center text-muted-foreground">
              {isLoading ? 'Sending reset link...' : 'Processing your request...'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordContent />
    </Suspense>
  );
}