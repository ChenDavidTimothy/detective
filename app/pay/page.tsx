'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { StripeBuyButton } from '@/components/StripeBuyButton';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentPage() {
  const { subscription, isLoading, error } = useSubscription();
  const router = useRouter();

  // Redirect if already subscribed
  useEffect(() => {
    if ( (subscription?.status === 'active' || subscription?.status === 'trialing') && !subscription.cancel_at_period_end) {
      const timer = setTimeout(() => {
        router.push('/profile');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [subscription, router]);

  // Check if user can subscribe
  const canSubscribe = !isLoading && 
    (!subscription || 
    (subscription.status === 'canceled' && !subscription.cancel_at_period_end));

  // Add error handling
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error Loading Subscription</CardTitle>
            <CardDescription>
              Unable to load subscription information. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={() => router.push('/pay')}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canSubscribe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Subscription Not Available</CardTitle>
            <CardDescription>
              You already have an active or pending subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={() => router.push('/profile')}
            >
              View Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl text-center">
            Complete Your Purchase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SubscriptionStatus />

          <StripeBuyButton
            className="flex justify-center text-neutral"
            buyButtonId={process.env.NEXT_PUBLIC_STRIPE_BUTTON_ID || ''}
            publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
          />
        </CardContent>
      </Card>
    </div>
  );
}