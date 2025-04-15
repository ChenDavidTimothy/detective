// app/cases/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getCaseById } from '@/lib/detective-cases';
import { useCaseAccess } from '@/hooks/useCaseAccess';
import { PayPalCheckout } from '@/components/PayPalCheckout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorBoundary } from 'react-error-boundary';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const caseId = params.id as string;
  const detectiveCase = getCaseById(caseId);
  const { hasAccess, isLoading, error } = useCaseAccess(caseId);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    // Reload the page after successful payment to refresh access status
    if (paymentSuccess) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess]);

  if (!detectiveCase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Case Not Found</h1>
          <Button onClick={() => router.push('/cases')}>
            Back to Cases
          </Button>
        </div>
      </div>
    );
  }

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
                  detectiveCase.difficulty === 'easy' ? 'default' : 
                  detectiveCase.difficulty === 'medium' ? 'secondary' : 
                  'destructive'
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
              <p className="text-muted-foreground">{detectiveCase.description}</p>
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
                    Here you would display the full case details that are only available to users who have purchased the case.
                  </p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">Case Evidence #1</p>
                    <p className="text-sm text-muted-foreground">First piece of evidence...</p>
                  </div>
                </div>
              </>
            ) : paymentSuccess ? (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500">
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Payment successful! Refreshing page...
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-center font-medium">Purchase this case to view its contents</p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="mt-4">
                  {user ? (
                    <ErrorBoundary
                      fallbackRender={({ error }) => (
                        <div className="p-4 border border-destructive rounded-lg">
                          <p className="text-destructive">Payment system temporarily unavailable.</p>
                          <p className="text-sm text-muted-foreground mt-2">Please try again later.</p>
                        </div>
                      )}
                    >
                      <PayPalCheckout 
                        detectiveCase={detectiveCase}
                        onSuccess={() => setPaymentSuccess(true)}
                        onError={(err) => console.error("Payment failed:", err)}
                      />
                    </ErrorBoundary>
                  ) : (
                    <Button 
                      onClick={() => router.push('/login?redirect=' + encodeURIComponent(`/cases/${caseId}`))}
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