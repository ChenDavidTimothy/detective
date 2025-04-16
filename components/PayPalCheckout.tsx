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

export function PayPalCheckout(props: PayPalCheckoutProps) {
  const { detectiveCase, userId, onSuccess, onError } = props;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!userId);
  const { clientId } = usePayPal();
  const [{ isPending, isRejected, isResolved }] = usePayPalScriptReducer();

  // Log PayPal script loading state for debugging
  useEffect(() => {
    console.log('PayPal script state:', { isPending, isRejected, isResolved });
  }, [isPending, isRejected, isResolved]);

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

  // Called when PayPal buttons components are ready
  const onButtonsReady = useCallback(() => {
    console.log('PayPal buttons are ready to use');
  }, []);

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
          onButtonsReady={onButtonsReady}
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
  onButtonsReady
}: {
  detectiveCase: DetectiveCase;
  userId: string;
  onSuccess?: (details: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
  onButtonsReady?: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
    
    // Call the callback when buttons are ready
    if (onButtonsReady) {
      onButtonsReady();
    }
  }, [detectiveCase.price, onButtonsReady]);

  const createOrder = useCallback((_data: unknown, actions: any) => {
    console.log('Creating PayPal order');
    return actions.order.create({
      purchase_units: [{
        description: `Detective Case: ${detectiveCase.title}`,
        amount: {
          value: detectiveCase.price.toFixed(2),
          currency_code: 'USD',
        },
      }],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    });
  }, [detectiveCase.title, detectiveCase.price]);

  // Rest of the component remains the same...
  const savePurchaseDirectly = useCallback(async (orderId: string) => {
    // Implementation remains the same
    try {
      console.log('Attempting direct database save as fallback');
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
            notes: 'Saved directly due to verification failure'
          },
          { onConflict: 'user_id,case_id' }
        );
      if (error) {
        console.error('Fallback database error:', error);
        throw error;
      }
      console.log('Fallback database save successful');
      return true;
    } catch (err) {
      console.error('Fallback save failed:', err);
      return false;
    }
  }, [userId, detectiveCase.id, detectiveCase.price]);

  const handleApprove = useCallback(async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      console.log('Payment approved, processing...');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Payment processing timeout')), 30000)
      );
      const details = await Promise.race([
        actions.order.capture(),
        timeoutPromise
      ]);
      if (!userId) {
        throw new Error('User not found');
      }
      console.log('Payment captured successfully, verifying with server...');
      let verificationSuccess = false;
      try {
        const verifyResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: details.id,
            userId: userId,
            caseId: detectiveCase.id,
            amount: detectiveCase.price,
          }),
        });
        const contentType = verifyResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Non-JSON response from verification endpoint: ${await verifyResponse.text()}`);
        }
        const verifyData = await verifyResponse.json();
        if (!verifyResponse.ok) {
          console.error('Verification error response:', verifyData);
          throw new Error(verifyData.error || 'Unknown verification error');
        }
        console.log('Verification successful:', verifyData);
        verificationSuccess = true;
      } catch (verifyError) {
        console.error('Payment verification failed:', verifyError);
        console.warn('Attempting fallback direct database save...');
        const fallbackSuccess = await savePurchaseDirectly(details.id);
        if (!fallbackSuccess) {
          console.error('Both verification and fallback save failed');
        } else {
          verificationSuccess = true;
          console.log('Fallback save successful');
        }
      }
      if (onSuccess) {
        onSuccess({
          ...details,
          verificationSuccess,
        });
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      let errorMessage = 'Payment processing failed. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('Window closed')) {
          errorMessage = 'Payment window was closed. Please try again when you\'re ready to complete your purchase.';
        }
      }
      setLocalError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error('Payment capture failed'));
      }
    } finally {
      setIsProcessing(false);
    }
  }, [userId, detectiveCase.id, detectiveCase.price, onSuccess, onError, savePurchaseDirectly]);

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
        style={{ layout: "vertical", shape: "rect" }}
        disabled={isProcessing}
        forceReRender={[detectiveCase.price]}
        createOrder={createOrder}
        onApprove={handleApprove}
        onCancel={() => {
          setIsProcessing(false);
          console.log('Payment cancelled');
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          setIsProcessing(false);
          setLocalError('Payment system error. Please try again later.');
          if (onError) {
            onError(err instanceof Error ? err : new Error('PayPal error'));
          }
        }}
        onInit={() => console.log('PayPal buttons initialized')}
      />
      {isProcessing && (
        <div className="mt-4 text-center flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Processing payment, please wait...</span>
        </div>
      )}
    </>
  );
}