'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UpdatePasswordPage() {
  const { supabase } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for valid recovery session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Let Supabase handle the auth flow automatically
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setError('Could not verify recovery session. Please request a new password reset link.');
          return;
        }
        
        if (!data.session) {
          // No active session found
          setError('No active recovery session found. Your link may have expired.');
          return;
        }
        
        // Session found - we're good to go
        setError(null);
      } catch (err) {
        console.error('Verification error:', err);
        setError('An error occurred during verification.');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifySession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Update password
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;
      
      // Success! Show success message
      setSuccess(true);
      
      // Schedule redirect after success
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      console.error('Password update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state during initial session check
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Update Password</CardTitle>
            <CardDescription>
              Verifying your recovery session...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form UI
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Update Password</CardTitle>
          <CardDescription>
            Please enter your new password
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {error}
                <div className="mt-2">
                  <Button
                    onClick={() => router.push('/reset-password?email=')}
                    variant="link"
                    className="text-destructive p-0"
                  >
                    Request a new reset link
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {success ? (
            <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <AlertDescription className="text-green-600 dark:text-green-400">
                <p>Password updated successfully!</p>
                <p className="mt-2">Redirecting to login page...</p>
                <div className="mt-4 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 dark:border-green-400"></div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    minLength={6}
                    disabled={!!error}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    minLength={6}
                    disabled={!!error}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading || !!error}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}