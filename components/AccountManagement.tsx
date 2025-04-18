// components/AccountManagement.tsx
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signOut } from '@/app/login/actions';
import { tryCatch, isSuccess, isFailure } from '@/utils/result';

interface AccountManagementProps {
  initialUserData?: User | null;
}

export function AccountManagement({ initialUserData }: AccountManagementProps) {
  const [user, setUser] = useState<User | null>(initialUserData ?? null);
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Fetch user data if not provided
  useEffect(() => {
    if (!initialUserData) {
      (async () => {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      })();
    }
  }, [initialUserData]);

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError('');
    
    // Use tryCatch for the fetch operation
    const deleteResult = await tryCatch(
      fetch(`/api/user/delete?userId=${user.id}`, { method: 'DELETE' })
    );
    
    if (isFailure(deleteResult)) {
      console.error('Delete account error:', deleteResult.error);
      setError(deleteResult.error.message || 'Failed to delete account');
      setIsLoading(false);
      return;
    }
    
    // Check if the response is ok
    const response = deleteResult.data;
    if (!response.ok) {
      const responseBodyResult = await tryCatch(response.json());
      const errorMessage = isSuccess(responseBodyResult) 
        ? responseBodyResult.data.error || 'Failed to delete account'
        : 'Failed to delete account';
      
      setError(errorMessage);
      setIsLoading(false);
      return;
    }
    
    // Handle successful deletion
    const signOutResult = await tryCatch(signOut());
    if (isFailure(signOutResult)) {
      console.error('Sign out error after account deletion:', signOutResult.error);
    }
    
    router.push('/login');
    setIsLoading(false);
  };

  const handleResetPassword = () => {
    if (isResettingPassword || !user?.email) return;
    setIsResettingPassword(true);
    router.push(`/reset-password?email=${encodeURIComponent(user.email)}`);
    // No need to reset isResettingPassword, as navigation occurs
  };

  if (!user) {
    return <div>Loading account information...</div>;
  }

  const isOAuthUser = user.app_metadata?.provider === 'google';

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Account Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 text-muted-foreground">
          <p>
            <span className="font-medium">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-medium">Last Sign In:</span>{' '}
            {user.last_sign_in_at
              ? new Date(user.last_sign_in_at).toLocaleString()
              : 'N/A'}
          </p>
          <p>
            <span className="font-medium">Account Type:</span>{' '}
            {isOAuthUser ? 'Google Account' : 'Email Account'}
          </p>
        </div>
        <div>
          {!isOAuthUser && (
            <Button
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              variant="outline"
              className="w-full justify-start"
            >
              {isResettingPassword
                ? 'Processing Request...'
                : 'Reset Password'}
            </Button>
          )}
          <Button
            onClick={() => setIsDeleteModalOpen(true)}
            variant="destructive"
            className="w-full justify-start mt-4"
          >
            Delete Account
          </Button>
        </div>
      </CardContent>
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently
              deleted.
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
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}