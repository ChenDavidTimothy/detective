'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DetectiveCase } from '@/lib/detective-cases';
import { useCaseAccess } from '@/hooks/useCaseAccess';
import { PayPalCheckout } from '@/components/PayPalCheckout';
import { PaymentResult } from '@/components/PaymentResult';
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
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // When payment is successful, refresh access check
  const handlePaymentSuccess = (details: Record<string, unknown>) => {
    setPaymentSuccess(true);
    refresh(); // Re-fetch access from Supabase
    // Optionally, log details
    console.log('Payment completed successfully', details);
  };

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
            ) : hasAccess ? (
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
            ) : (
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
                  {paymentSuccess ? (
                    <PaymentResult 
                      status="success"
                      message="Thank you for your purchase! You now have access to this case."
                      redirectPath={`/cases/${caseId}`}
                      redirectLabel="View Case Details"
                      autoRedirectSeconds={2}
                    />
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
                        // Any cleanup needed when error boundary resets
                        console.log('Payment component error boundary reset');
                      }}
                    >
                      <PayPalCheckout
                        detectiveCase={detectiveCase}
                        onSuccess={handlePaymentSuccess}
                        onError={(err) => {
                          console.error('Payment failed:', err);
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
