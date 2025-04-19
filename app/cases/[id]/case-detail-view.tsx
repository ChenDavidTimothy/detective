// app/cases/[id]/case-detail-view.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';

import { DetectiveCase } from '@/lib/types/detective-case';
import { type CaseMedia } from '@/lib/services/media-service-client';
import { useCaseAccess } from '@/hooks/useCaseAccess';
import { PaymentSuccessMessage } from '@/components/PaymentSuccessMessage';
import CaseMediaSection from './case-media-section';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define the specific variants allowed by the Badge component
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// Tiny reusable spinner to remove duplication
const Spinner = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center p-6">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
    <span>{label}</span>
  </div>
);

// Dynamically load PayPalCheckout client‑side only
const PayPalCheckout = dynamic(
  () => import('@/components/PayPalCheckout').then((mod) => mod.PayPalCheckout),
  {
    ssr: false,
    loading: () => <Spinner label="Loading payment options..." />,
  }
);

type CaseDetailViewProps = {
  detectiveCase: DetectiveCase;
  caseId: string;
  initialHasAccess: boolean;
  initialCaseMedia: CaseMedia[];
  userId?: string;
};

export default function CaseDetailView({
  detectiveCase,
  caseId,
  initialHasAccess,
  initialCaseMedia,
  userId,
}: CaseDetailViewProps) {
  const router = useRouter();
  const { hasAccess, isLoading, error, refresh } = useCaseAccess(
    caseId,
    initialHasAccess
  );
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // On successful payment we flip to success view and re‑check access
  const handlePaymentSuccess = (details: Record<string, unknown>) => {
    console.log('Payment completed successfully', details);
    setPaymentSuccess(true);
    refresh();
  };

  // Map difficulty level → badge variant
  const difficultyVariants: Record<
    DetectiveCase['difficulty'],
    BadgeVariant // Use the specific type here
  > = {
    easy: 'default',
    medium: 'secondary',
    hard: 'destructive',
  };

  // Clear, sequential rendering logic
  const renderContent = () => {
    if (isLoading) {
      return <Spinner label="Checking access..." />;
    }

    if (paymentSuccess) {
      return (
        <PaymentSuccessMessage
          message="Thank you for your purchase. You now have access to this case."
          redirectPath={`/cases/${caseId}`}
          redirectDelay={2500}
        />
      );
    }

    if (hasAccess) {
      return (
        <>
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500">
            <AlertDescription className="text-green-600 dark:text-green-400">
              You have access to this case!
            </AlertDescription>
          </Alert>
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Case Details</h3>
            <p className="text-muted-foreground mb-4">
              {detectiveCase.content ||
                'Here you would display the full case details that are only available to users who have purchased the case.'}
            </p>
          </div>
          <div className="mt-6">
            <CaseMediaSection 
              caseId={caseId} 
              initialMedia={initialCaseMedia}
              initialHasAccess={hasAccess}
            />
          </div>
        </>
      );
    }

    // No access → purchase flow
    return (
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
          {userId ? (
            <ErrorBoundary
              fallbackRender={({ error, resetErrorBoundary }) => (
                <div className="p-4 border border-destructive rounded-lg">
                  <p className="text-destructive font-medium">
                    Payment system error
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    {error instanceof Error
                      ? error.message
                      : 'An unexpected error occurred'}
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
            >
              <PayPalCheckout
                detectiveCase={detectiveCase}
                userId={userId}
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
                  `/login?returnTo=${encodeURIComponent(
                    `/cases/${caseId}`
                  )}`
                )
              }
              className="w-full"
            >
              Login to Purchase
            </Button>
          )}
        </div>
      </div>
    );
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
              <CardTitle className="text-2xl">
                {detectiveCase.title}
              </CardTitle>
              <Badge variant={difficultyVariants[detectiveCase.difficulty]}>
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

            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
