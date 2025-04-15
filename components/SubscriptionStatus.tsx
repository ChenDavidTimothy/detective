import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SubscriptionStatus() {
  const { subscription, isLoading, error } = useSubscription();
  const router = useRouter();

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Checking subscription status...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error checking subscription: {error}</AlertDescription>
      </Alert>
    );
  }

  if (subscription?.status === 'active' || subscription?.status === 'trialing') {
    return (
      <div className="text-center space-y-4">
        <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <AlertDescription className="text-green-600 dark:text-green-400">
            You have an active subscription!
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push('/profile')}
        >
          View Subscription Details
        </Button>
      </div>
    );
  }

  return null;
}