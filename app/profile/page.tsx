'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { StripeBuyButton } from '@/components/StripeBuyButton';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

function ProfileContent() {
  const { user } = useAuth();
  const { subscription, isLoading: isLoadingSubscription, syncWithStripe, fetchSubscription } = useSubscription();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInTrial, trialEndTime } = useTrialStatus();

  // Show payment success message if redirected from successful payment
  useEffect(() => {
    if (paymentStatus === 'success') {
      // Could add a toast notification here
      console.log('Payment successful!');
    }
  }, [paymentStatus]);

  // Add error handling for subscription sync
  useEffect(() => {
    if (subscription?.stripe_subscription_id) {
      try {
        syncWithStripe(subscription.stripe_subscription_id);
        console.log('Subscription synced with Stripe successfully');
      } catch (err: unknown) {
        console.error('Error syncing with Stripe:', err);
        setError('Unable to load subscription details');
      }
    }
  }, [syncWithStripe, subscription?.stripe_subscription_id]);

  // Add loading timeout with auto-refresh
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let refreshAttempts = 0;
    const MAX_REFRESH_ATTEMPTS = 3;
    const REFRESH_INTERVAL = 3000; // 3 seconds
    
    const attemptRefresh = async () => {
      if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
        refreshAttempts++;
        console.log(`Attempting auto-refresh (${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`);
        await fetchSubscription();
        
        // If still loading, schedule next attempt
        if (isLoadingSubscription) {
          timeoutId = setTimeout(attemptRefresh, REFRESH_INTERVAL);
        }
      } else {
        setError('Loading subscription is taking longer than expected. Please refresh the page.');
      }
    };

    if (isLoadingSubscription) {
      timeoutId = setTimeout(attemptRefresh, REFRESH_INTERVAL);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoadingSubscription, fetchSubscription]);

  // Add useEffect for auth check
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Add refresh effect
  useEffect(() => {
    if (user?.id) {
      fetchSubscription();
    }
  }, [user?.id, fetchSubscription]);

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return;
    
    setIsCancelling(true);
    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: subscription.stripe_subscription_id 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to cancel subscription');
      
      setIsCancelModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return;
    
    try {
      const response = await fetch('/api/stripe/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: subscription.stripe_subscription_id 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to reactivate subscription');
      
      router.refresh();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-destructive">
          Failed to load subscription details. Please try refreshing.
        </div>
      }
    >
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-4xl mx-auto p-8">
          {paymentStatus === 'success' && (
            <div className="mb-8 p-4 bg-success/10 rounded-lg">
              <p className="text-success">
                🎉 Thank you for your subscription! Your payment was successful.
              </p>
            </div>
          )}
          
          <h1 className="text-3xl font-bold mb-8">Profile</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
            </CardHeader>
            
            {/* User Information */}
            <CardContent className="space-y-2 text-muted-foreground">
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Last Sign In:</span> {new Date(user?.last_sign_in_at || '').toLocaleString()}</p>
              <p><span className="font-medium">Account Type:</span> {user?.app_metadata?.provider === 'google' ? 'Google Account' : 'Email Account'}</p>
            </CardContent>
            
            <CardFooter>
              {user?.app_metadata?.provider !== 'google' && (
                <Button
                  onClick={() => router.push(`/reset-password?email=${encodeURIComponent(user?.email || '')}`)}
                  variant="outline"
                  className="w-full justify-start"
                >
                  Reset Password
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Subscription Section */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
            </CardHeader>
            
            <CardContent>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : isLoadingSubscription ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading subscription details...</span>
                </div>
              ) : subscription ? (
                <div className="space-y-4">
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Started:</span> {new Date(subscription.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  {subscription.status === 'canceled' ? (
                    <Button
                      asChild
                      className="mt-4"
                    >
                      <Link href="/pay">
                        Resubscribe
                      </Link>
                    </Button>
                  ) : subscription.cancel_at_period_end ? (
                    <div className="mt-4 p-4 bg-warning/10 text-warning rounded-lg">
                      <p className="mb-2">
                        Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                      <Button
                        onClick={handleReactivateSubscription}
                        className="bg-success hover:bg-success/90 text-success-foreground"
                      >
                        Resume Subscription
                      </Button>
                    </div>
                  ) : (subscription.status === 'active' || subscription.status === 'trialing') ? (
                    <Button
                      onClick={() => setIsCancelModalOpen(true)}
                      variant="destructive"
                      className="mt-4"
                    >
                      Cancel Subscription
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {isInTrial ? (
                    <div className="text-warning">
                      <p>
                        You are currently in your 48-hour trial period. Your trial will end on {' '}
                        {trialEndTime ? new Date(trialEndTime).toLocaleDateString() : 'soon'}.
                      </p>
                      <p className="mt-2">Subscribe now to continue using the app after the trial ends.</p>
                    </div>
                  ) : trialEndTime ? (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
                      <p>
                        Your trial period ended on {new Date(trialEndTime).toLocaleDateString()}.
                      </p>
                      <p className="mt-2">Subscribe now to regain access to the app.</p>
                    </div>
                  ) : (
                    <p>Subscribe to unlock the full experience.</p>
                  )}
                  
                  <StripeBuyButton
                    buyButtonId={process.env.NEXT_PUBLIC_STRIPE_BUTTON_ID || ''}
                    publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cancel Confirmation Modal */}
          <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Subscription?</DialogTitle>
                <DialogDescription>
                  You&apos;ll continue to have access until the end of your billing period on {new Date(subscription?.current_period_end || '').toLocaleDateString()}. No refunds are provided for cancellations.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-row justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                >
                  Keep Subscription
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="flex items-center gap-2"
                >
                  {isCancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfileContent />
    </Suspense>
  );
}