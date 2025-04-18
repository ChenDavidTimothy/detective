// components/PayPalCheckout.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { DetectiveCase } from '@/lib/types/detective-case';

import {
  PayPalButtons,
  usePayPalScriptReducer,
  type PayPalButtonsComponentProps,
} from '@paypal/react-paypal-js';
import type {
  CreateOrderData,
  CreateOrderActions,
  OnApproveData,
  OnApproveActions,
} from '@paypal/paypal-js';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { usePayPal } from '@/contexts/PayPalContext';
import { tryCatch, isSuccess, isFailure, type Result } from '@/utils/result';

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
  // supabase client once
  const supabase = useMemo(() => createClient(), []);

  // unify external or fetched user ID
  const [effectiveUserId, setEffectiveUserId] = useState<string | undefined>(
    userId
  );
  const [isLoading, setIsLoading] = useState(!userId);

  // PayPal script state
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const { clientId } = usePayPal();

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // fetch current user ID if none provided
  useEffect(() => {
    if (userId) {
      setIsLoading(false);
      return;
    }
    const fetchUser = async () => {
      const result = await tryCatch(supabase.auth.getUser());
      if (isSuccess(result)) {
        setEffectiveUserId(result.data.data.user?.id ?? undefined);
      } else {
        console.error('Error fetching user:', result.error);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [userId, supabase]);

  // PAYPAL: createOrder
  const createOrder: PayPalButtonsComponentProps['createOrder'] =
    useCallback(
      (_: CreateOrderData, actions: CreateOrderActions) =>
        actions.order!.create({
          intent: 'CAPTURE',
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
        }),
      [detectiveCase.title, detectiveCase.price]
    );

  // fallback direct DB save
  const savePurchaseDirectly = useCallback(
    async (orderId: string): Promise<Result<boolean>> => {
      if (!effectiveUserId) {
        return { data: null, error: new Error('User not found') };
      }
      const { error } = await supabase
        .from('user_purchases')
        .upsert(
          {
            user_id: effectiveUserId,
            case_id: detectiveCase.id,
            payment_id: orderId,
            amount: detectiveCase.price,
            notes: 'Saved directly due to verification failure',
          },
          { onConflict: 'user_id,case_id' }
        );
      if (error) {
        console.error('Direct save failed:', error);
        return { data: null, error };
      }
      return { data: true, error: null };
    },
    [supabase, effectiveUserId, detectiveCase]
  );

  // onApprove handler
  const handleApprove: PayPalButtonsComponentProps['onApprove'] =
    useCallback(
      async (data: OnApproveData, actions: OnApproveActions) => {
        setIsProcessing(true);

        // capture with 30s timeout
        const timeout = new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('Payment processing timeout')), 30000)
        );
        const captureResult = await tryCatch(
          Promise.race([actions.order!.capture(), timeout])
        );
        if (isFailure(captureResult)) {
          const err = captureResult.error;
          const msg = err.message.includes('Window closed')
            ? "Payment window was closed. Please try again."
            : 'Payment processing failed. Please try again.';
          setLocalError(msg);
          onError?.(err);
          return setIsProcessing(false);
        }

        // server‑side verification
        const verifyRes = await tryCatch(
          fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderID,
              userId: effectiveUserId,
              caseId: detectiveCase.id,
              amount: detectiveCase.price,
            }),
          })
        );

        let verified = false;
        if (isSuccess(verifyRes)) {
          const resp = verifyRes.data;
          const ct = resp.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            const txt = await resp.text().catch(() => 'Unexpected response');
            setLocalError(`Non-JSON response: ${txt}`);
            onError?.(new Error('Invalid server response'));
            return setIsProcessing(false);
          }
          const json = await resp.json().catch((e) => ({ error: e }));
          if (!resp.ok || json.error) {
            setLocalError(json.error || 'Unknown error');
            onError?.(new Error(json.error || 'Verification failed'));
            return setIsProcessing(false);
          }
          verified = true;
        } else {
          // fallback
          const fb = await savePurchaseDirectly(data.orderID);
          verified = isSuccess(fb) && fb.data === true;
          if (!verified) {
            setLocalError('Payment verification failed. Contact support.');
            onError?.(verifyRes.error);
            return setIsProcessing(false);
          }
        }

        // final success
        onSuccess?.({ ...captureResult.data, verificationSuccess: verified });
        setIsProcessing(false);
      },
      [
        effectiveUserId,
        detectiveCase.id,
        detectiveCase.price,
        onError,
        onSuccess,
        savePurchaseDirectly,
      ]
    );

  // other button callbacks
  const handleCancel: PayPalButtonsComponentProps['onCancel'] =
    useCallback(() => setIsProcessing(false), []);
  const handleError: PayPalButtonsComponentProps['onError'] =
    useCallback(
      (err: unknown) => {
        setIsProcessing(false);
        setLocalError('Payment system error. Please try again later.');
        onError?.(err instanceof Error ? err : new Error('PayPal error'));
      },
      [onError]
    );

  // --- Guards & placeholders ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[150px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!effectiveUserId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Please login to make a purchase</AlertDescription>
      </Alert>
    );
  }

  if (!clientId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Payment system is not properly configured. Contact support.
        </AlertDescription>
      </Alert>
    );
  }

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-[150px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading PayPal...
        </span>
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

  // --- PayPal button UI ---
  return (
    <div className="paypal-button-container">
      <div className="w-full min-h-[150px]">
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
          disabled={isProcessing}
          forceReRender={[detectiveCase.price.toString()]}
          createOrder={createOrder}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onError={handleError}
        />
      </div>

      {isProcessing && (
        <div className="mt-4 text-center flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Processing payment, please wait...
          </span>
        </div>
      )}

      <div className="text-sm text-muted-foreground mt-2 text-center">
        Price: ${detectiveCase.price.toFixed(2)} USD
      </div>
    </div>
  );
}
