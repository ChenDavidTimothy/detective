'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DetectiveCase } from '@/lib/detective-cases';
import { useCaseAccess } from '@/hooks/useCaseAccess';
import { PayPalCheckout } from '@/components/PayPalCheckout';
import { PaymentSuccessMessage } from '@/components/PaymentSuccessMessage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorBoundary } from 'react-error-boundary';

type CaseDetailViewProps = {
  detectiveCase: DetectiveCase;
  caseId: string;
};

export default function CaseDetailView({ detectiveCase, caseId }: CaseDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { hasAccess, isLoading, error, refresh } = useCaseAccess(caseId);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  // Add a separate flag to prevent content flash
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);

  // When payment is successful, show success and redirect
  const handlePaymentSuccess = (details: Record<string, unknown>) => {
    console.log('Payment completed successfully', details);
    
    // Mark payment as complete to prevent content flash
    setIsPaymentComplete(true);
    // Update status to show success UI
    setPaymentStatus('success');
    
    // Refresh access in the background 
    refresh();
  };

  // Determine what to show
  const showPaidContent = hasAccess && !isPaymentComplete;
  const showPaymentOptions = !hasAccess && !isPaymentComplete;
  const showSuccessMessage = isPaymentComplete && paymentStatus === 'success';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => router.push('/cases')}
          variant="outline"
          className="mb-6"
        >
          ← Back to Cases
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl">{detectiveCase.title}</CardTitle>
              <Badge
                variant={
                  detectiveCase.difficulty === 'easy'
                    ? 'default'
                    : detectiveCase.difficulty === 'medium'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {detectiveCase.difficulty}
              </Badge>
            </div>
            <CardDescription>
              Price: ${detectiveCase.price.toFixed(2)} USD
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Case Overview</h3>
              <p className="text-muted-foreground">
                {detectiveCase.description}
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : showPaidContent ? (
              <>
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500">
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    You have access to this case!
                  </AlertDescription>
                </Alert>

                <div className="p-6 border border-border rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Case Details</h3>
                  <p className="text-muted-foreground mb-4">
                    Here you would display the full case details that are only
                    available to users who have purchased the case.
                  </p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">Case Evidence #1</p>
                    <p className="text-sm text-muted-foreground">
                      First piece of evidence...
                    </p>
                  </div>
                </div>
              </>
            ) : showSuccessMessage ? (
              // Use the new component for success message
              <PaymentSuccessMessage
                message="Thank you for your purchase. You now have access to this case."
                redirectPath={`/cases/${caseId}`}
                redirectDelay={2500}
              />
            ) : showPaymentOptions ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-center font-medium">
                    Purchase this case to view its contents
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="mt-4">
                  {paymentStatus === 'processing' ? (
                    <div className="flex items-center justify-center p-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                      <span>Processing payment...</span>
                    </div>
                  ) : user ? (
                    <ErrorBoundary
                      fallbackRender={({ error, resetErrorBoundary }) => (
                        <div className="p-4 border border-destructive rounded-lg">
                          <p className="text-destructive font-medium">
                            Payment system error
                          </p>
                          <p className="text-sm text-muted-foreground mt-2 mb-4">
                            {error instanceof Error ? error.message : 'An unexpected error occurred'}
                          </p>
                          <Button 
                            onClick={resetErrorBoundary}
                            variant="outline"
                            size="sm"
                          >
                            Try Again
                          </Button>
                        </div>
                      )}
                      onReset={() => {
                        console.log('Payment component error boundary reset');
                      }}
                    >
                      <PayPalCheckout
                        detectiveCase={detectiveCase}
                        onSuccess={handlePaymentSuccess}
                        onError={(err) => {
                          console.error('Payment failed:', err);
                          setPaymentStatus('idle');
                        }}
                      />
                    </ErrorBoundary>
                  ) : (
                    <Button
                      onClick={() =>
                        router.push(
                          '/login?redirect=' +
                            encodeURIComponent(`/cases/${caseId}`)
                        )
                      }
                      className="w-full"
                    >
                      Login to Purchase
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
