'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface PaymentResultProps {
  status: 'success' | 'error';
  message?: string;
  redirectPath?: string;
  redirectLabel?: string;
  autoRedirectSeconds?: number;
}

export function PaymentResult({
  status,
  message,
  redirectPath = '/profile',
  redirectLabel = 'Go to Profile',
  autoRedirectSeconds = 5
}: PaymentResultProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(autoRedirectSeconds);
  
  useEffect(() => {
    // Only auto-redirect on success
    if (status !== 'success') return;
    
    if (countdown <= 0) {
      router.push(redirectPath);
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, redirectPath, router, status]);
  
  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <div className="flex justify-center mb-4">
          {status === 'success' ? (
            <CheckCircle className="h-12 w-12 text-success" />
          ) : (
            <XCircle className="h-12 w-12 text-destructive" />
          )}
        </div>
        <CardTitle className="text-center">
          {status === 'success' ? 'Payment Successful' : 'Payment Failed'}
        </CardTitle>
        <CardDescription className="text-center">
          {message || (status === 'success' 
            ? 'Your payment has been processed successfully.' 
            : 'There was a problem processing your payment.')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {status === 'success' && (
          <div className="text-center text-sm text-muted-foreground">
            Redirecting to your profile in {countdown} seconds...
            <div className="mt-2 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <Button
          onClick={() => router.push(redirectPath)}
          variant={status === 'success' ? 'outline' : 'default'}
        >
          {redirectLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}