// app/(protected)/profile/profile-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from 'react-error-boundary';
import { tryCatch, isSuccess, isFailure } from '@/utils/result';
import { signOut } from '@/app/login/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface PurchasedCase {
  case_id: string;
  purchase_date?: string;
  details?: {
    id: string;
    title: string;
    description: string;
    price: number;
    difficulty: 'easy' | 'medium' | 'hard';
    image_url?: string;
  };
}

interface UserPreferences {
  id: string;
  user_id: string;
  has_completed_onboarding: boolean;
}

interface ProfileClientProps {
  initialUserData: User | null;
  initialPurchasedCases: PurchasedCase[];
  initialPreferences: UserPreferences;
}

export default function ProfileClient({
  initialUserData,
  initialPurchasedCases,
}: ProfileClientProps) {
  const router = useRouter();

  // User state
  const user = initialUserData;
  const purchasedCases = initialPurchasedCases;
  
  // UI state management
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if user authenticated with OAuth
  const isOAuthUser = user?.app_metadata?.provider === 'google';

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    
    setIsDeleting(true);
    setError(null);
    
    // Use tryCatch for API call to delete user account
    const deleteResult = await tryCatch(
      fetch(`/api/user/delete?userId=${user.id}`, { method: 'DELETE' })
    );
    
    if (isFailure(deleteResult)) {
      console.error('Delete account error:', deleteResult.error);
      setError('Connection error. Please try again later.');
      setIsDeleting(false);
      return;
    }
    
    // Check if the response is ok
    const response = deleteResult.data;
    if (!response.ok) {
      // Try to parse error message from response
      const responseBodyResult = await tryCatch(response.json());
      const errorMessage = isSuccess(responseBodyResult) 
        ? responseBodyResult.data.error || 'Failed to delete account'
        : 'Failed to delete account';
      
      setError(errorMessage);
      setIsDeleting(false);
      return;
    }
    
    // Handle successful deletion - sign out and redirect
    const signOutResult = await tryCatch(signOut());
    if (isFailure(signOutResult)) {
      console.error('Sign out error after account deletion:', signOutResult.error);
    }
    
    // Force a full page reload to ensure all components reset their state
    window.location.href = '/login';
  };

  // Handle password reset request
  const handleResetPassword = () => {
    if (isResettingPassword || !user?.email) return;
    setIsResettingPassword(true);
    router.push(`/reset-password?email=${encodeURIComponent(user.email)}`);
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-destructive">
          Failed to load profile details. Please try refreshing.
        </div>
      }
    >
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-4xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-8">Profile</h1>

          {/* Account Management Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* User Information */}
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                <p>
                  <span className="font-medium">Last Sign In:</span>{' '}
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : 'Unknown'}
                </p>
                <p>
                  <span className="font-medium">Account Type:</span>{' '}
                  {isOAuthUser ? 'Google Account' : 'Email Account'}
                </p>
              </div>

              {/* Account Actions */}
              <div className="flex flex-col gap-3">
                {/* Only show password reset for email accounts */}
                {!isOAuthUser && (
                  <Button
                    onClick={handleResetPassword}
                    disabled={isResettingPassword}
                    variant="outline"
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                )}
                
                {/* Delete Account Button */}
                <Button
                  onClick={() => setIsDeleteModalOpen(true)}
                  variant="destructive"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delete Account Confirmation Dialog */}
          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Account?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. All your data and purchased cases will be permanently removed.
                </DialogDescription>
              </DialogHeader>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Purchased Cases Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Detective Cases</CardTitle>
            </CardHeader>

            <CardContent>
              {purchasedCases.length > 0 ? (
                <div className="space-y-4">
                  {purchasedCases.map((purchase) => {
                    if (!purchase.details) return null;

                    return (
                      <div
                        key={purchase.case_id}
                        className="p-4 border rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <h3 className="font-medium">{purchase.details.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Purchased on:{' '}
                            {purchase.purchase_date
                              ? new Date(
                                  purchase.purchase_date
                                ).toLocaleDateString()
                              : 'Unknown date'}
                          </p>
                        </div>
                        <Button
                          onClick={() =>
                            router.push(`/cases/${purchase.case_id}`)
                          }
                          size="sm"
                        >
                          View Case
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You haven&apos;t purchased any detective cases yet.
                  </p>
                  <Button
                    onClick={() => router.push('/cases')}
                    variant="default"
                  >
                    Browse Detective Cases
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}