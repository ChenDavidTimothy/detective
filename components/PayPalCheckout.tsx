// components/PayPalCheckout.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { DetectiveCase } from '@/lib/detective-cases';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { usePayPal } from '@/contexts/PayPalContext';

interface PayPalCheckoutProps {
  detectiveCase: DetectiveCase;
  userId?: string;
  onSuccess?: (details: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

export function PayPalCheckout({
  detectiveCase,
  userId,
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!userId);
  const { clientId } = usePayPal();
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  useEffect(() => {
    if (userId) {
      setIsLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[150px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const effectiveUserId = userId || user?.id;

  if (!effectiveUserId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Please login to make a purchase
        </AlertDescription>
      </Alert>
    );
  }

  if (!clientId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Payment system is not properly configured. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-[150px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading PayPal...</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex flex-col gap-2">
          <p>Failed to load PayPal. Please try again.</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="self-end"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="paypal-button-container">
      <div className="w-full min-h-[150px]">
        <PayPalButtonWrapper
          detectiveCase={detectiveCase}
          userId={effectiveUserId}
          onSuccess={onSuccess}
          onError={onError}
        />
      </div>
      <div className="text-sm text-muted-foreground mt-2 text-center">
        Price: ${detectiveCase.price.toFixed(2)} USD
      </div>
    </div>
  );
}

function PayPalButtonWrapper({
  detectiveCase,
  userId,
  onSuccess,
  onError,
}: {
  detectiveCase: DetectiveCase;
  userId: string;
  onSuccess?: (details: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const createOrder = useCallback(
    (_data: unknown, actions: any) => {
      return actions.order.create({
        purchase_units: [
          {
            description: `Detective Case: ${detectiveCase.title}`,
            amount: {
              value: detectiveCase.price.toFixed(2),
              currency_code: 'USD',
            },
          },
        ],
        application_context: {
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      });
    },
    [detectiveCase.title, detectiveCase.price]
  );

  const savePurchaseDirectly = useCallback(
    async (orderId: string) => {
      try {
        if (!userId) throw new Error('User not found');
        const supabase = createClient();
        const { error } = await supabase
          .from('user_purchases')
          .upsert(
            {
              user_id: userId,
              case_id: detectiveCase.id,
              payment_id: orderId,
              amount: detectiveCase.price,
              notes: 'Saved directly due to verification failure',
            },
            { onConflict: 'user_id,case_id' }
          );
        if (error) throw error;
        return true;
      } catch (err) {
        return false;
      }
    },
    [userId, detectiveCase.id, detectiveCase.price]
  );

  const handleApprove = useCallback(
    async (data: any, actions: any) => {
      setIsProcessing(true);
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Payment processing timeout')), 30000)
        );
        const details = await Promise.race([
          actions.order.capture(),
          timeoutPromise,
        ]);
        if (!userId) throw new Error('User not found');
        let verificationSuccess = false;
        try {
          const verifyResponse = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: details.id,
              userId,
              caseId: detectiveCase.id,
              amount: detectiveCase.price,
            }),
          });
          const contentType = verifyResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(
              `Non-JSON response from verification endpoint: ${await verifyResponse.text()}`
            );
          }
          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok) {
            throw new Error(verifyData.error || 'Unknown verification error');
          }
          verificationSuccess = true;
        } catch {
          const fallbackSuccess = await savePurchaseDirectly(details.id);
          if (fallbackSuccess) verificationSuccess = true;
        }
        if (onSuccess) {
          onSuccess({
            ...details,
            verificationSuccess,
          });
        }
      } catch (err) {
        let errorMessage = 'Payment processing failed. Please try again.';
        if (err instanceof Error && err.message.includes('Window closed')) {
          errorMessage =
            "Payment window was closed. Please try again when you're ready to complete your purchase.";
        }
        setLocalError(errorMessage);
        if (onError) {
          onError(err instanceof Error ? err : new Error('Payment capture failed'));
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [
      userId,
      detectiveCase.id,
      detectiveCase.price,
      onSuccess,
      onError,
      savePurchaseDirectly,
    ]
  );

  if (localError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription className="flex flex-col gap-2">
          <p>{localError}</p>
          <Button
            onClick={() => setLocalError(null)}
            variant="outline"
            size="sm"
            className="self-end"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PayPalButtons
        style={{ layout: 'vertical', shape: 'rect' }}
        disabled={isProcessing}
        forceReRender={[detectiveCase.price]}
        createOrder={createOrder}
        onApprove={handleApprove}
        onCancel={() => setIsProcessing(false)}
        onError={(err) => {
          setIsProcessing(false);
          setLocalError('Payment system error. Please try again later.');
          if (onError) {
            onError(err instanceof Error ? err : new Error('PayPal error'));
          }
        }}
      />
      {isProcessing && (
        <div className="mt-4 text-center flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Processing payment, please wait...
          </span>
        </div>
      )}
    </>
  );
}
