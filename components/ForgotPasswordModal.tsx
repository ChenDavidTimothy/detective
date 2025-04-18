// components/ForgotPasswordModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword } from '@/app/login/actions';
import { tryCatch, isFailure } from '@/utils/result';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (isLoading) return;
    
    // Basic validation on submission
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', email.trim());
    
    // Use tryCatch to handle unexpected errors while preserving structured errors
    const resetResult = await tryCatch(resetPassword(formData));
    
    if (isFailure(resetResult)) {
      // Handle unexpected errors from the tryCatch wrapper
      setError('Failed to contact server. Please try again.');
      console.error('Unexpected error in password reset:', resetResult.error);
    } else {
      // Handle the AuthResult from resetPassword
      const authResult = resetResult.data;
      if (authResult.error) {
        setError(authResult.error.message);
      } else {
        setSuccess(true);
      }
    }
    
    setIsLoading(false);
  };

  const handleClose = () => {
    // Reset state when closing
    setError(null);
    setSuccess(false);
    setEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            We&apos;ll send a password reset link to your email address.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="space-y-4">
            <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <AlertDescription className="text-green-600 dark:text-green-400">
                Reset link has been sent to your email address. Please check your inbox.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                onClick={handleClose}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={isLoading || !email}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}