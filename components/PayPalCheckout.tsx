// components/PayPalCheckout.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { DetectiveCase } from '@/lib/detective-cases';

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
import { tryCatch, Result, isSuccess, isFailure } from '@/utils/result';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Fetch current user if no userId prop
  useEffect(() => {
    if (userId) {
      setIsLoading(false);
      return;
    }
    const fetchUser = async (): Promise<void> => {
      const supabase = createClient();
      const result = await tryCatch(supabase.auth.getUser());
      
      if (isSuccess(result)) {
        setUser(result.data.data.user);
      } else {
        console.error('Error fetching user:', result.error);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [userId]);

  const effectiveUserId = userId ?? user?.id;

  // Create order: note the required `intent: 'CAPTURE'`
  const createOrder: PayPalButtonsComponentProps['createOrder'] =
    useCallback(
      (data: CreateOrderData, actions: CreateOrderActions) => {
        return actions.order!.create({
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
        });
      },
      [detectiveCase.title, detectiveCase.price]
    );

  // Fallback direct DB save
  const savePurchaseDirectly = useCallback(
    async (orderId: string): Promise<Result<boolean>> => {
      if (!effectiveUserId) {
        return { data: null, error: new Error('User not found') };
      }

      const supabase = createClient();
      // Directly await the upsert operation
      const { data: _data, error } = await supabase
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
        )
        .select('user_id') // Select something small to confirm success
        .single(); // Ensure we expect one row or null

      // Construct the Result object based on the Supabase response
      if (error) {
        console.error('Direct save failed:', error);
        return { data: null, error };
      }
      // Consider success if no error occurred
      return { data: true, error: null }; 
    },
    [effectiveUserId, detectiveCase.id, detectiveCase.price]
  );

  // Handle approval
const handleApprove: PayPalButtonsComponentProps['onApprove'] =
  useCallback(
    async (data: OnApproveData, actions: OnApproveActions) => {
      setIsProcessing(true);
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Payment processing timeout')),
          30000
        )
      );
      
      // Capture the order with timeout
      const captureResult = await tryCatch(
        Promise.race([
          actions.order!.capture(),
          timeoutPromise,
        ])
      );

      if (isFailure(captureResult)) {
        const error = captureResult.error;
        let msg = 'Payment processing failed. Please try again.';
        
        if (error instanceof Error && error.message.includes('Window closed')) {
          msg = "Payment window was closed. Please try again when you're ready.";
        }
        
        setLocalError(msg);
        onError?.(error instanceof Error ? error : new Error('Capture failed'));
        setIsProcessing(false);
        return;
      }

      // Verify on your server
      const verificationResult = await tryCatch(
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

      let verificationSuccess = false;
      
      if (isSuccess(verificationResult)) {
        const response = verificationResult.data;
        const ct = response.headers.get('content-type') ?? '';
        
        if (!ct.includes('application/json')) {
          // Handle non-JSON response
          const textResult = await tryCatch(response.text());
          const errorMessage = isSuccess(textResult) 
            ? `Non-JSON response: ${textResult.data}`
            : 'Unexpected response from server';
            
          setLocalError(errorMessage);
          onError?.(new Error(errorMessage));
          setIsProcessing(false);
          return;
        }
        
        // Parse JSON response
        const jsonResult = await tryCatch(response.json());
        
        if (isFailure(jsonResult)) {
          setLocalError('Failed to parse server response');
          onError?.(jsonResult.error);
          setIsProcessing(false);
          return;
        }
        
        if (!response.ok) {
          const errorMessage = jsonResult.data.error || 'Unknown error';
          setLocalError(errorMessage);
          onError?.(new Error(errorMessage));
          setIsProcessing(false);
          return;
        }
        
        verificationSuccess = true;
      } else {
        // Fallback to direct save if verification API call failed
        const fallbackResult = await savePurchaseDirectly(data.orderID);
        verificationSuccess = isSuccess(fallbackResult) && fallbackResult.data;
        
        if (!verificationSuccess) {
          setLocalError('Payment verification failed. Please contact support.');
          onError?.(verificationResult.error);
          setIsProcessing(false);
          return;
        }
      }

      // Success path
      onSuccess?.({ ...captureResult.data, verificationSuccess });
      setIsProcessing(false);
    },
    [
      effectiveUserId,
      detectiveCase.id,
      detectiveCase.price,
      onSuccess,
      onError,
      savePurchaseDirectly,
    ]
  );

  // Handle cancellation (no unused param)
  const handleCancel: PayPalButtonsComponentProps['onCancel'] =
    useCallback(() => {
      setIsProcessing(false);
    }, []);

  // Handle PayPal‑level errors
  const handleError: PayPalButtonsComponentProps['onError'] =
  useCallback(
    (err: unknown) => {
      setIsProcessing(false);
      setLocalError('Payment system error. Please try again later.');
      onError?.(
        err instanceof Error ? err : new Error('PayPal error')
      );
    },
    [onError]
  );


  // -- Render guards --------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[150px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading...
        </span>
      </div>
    );
  }

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
          Payment system is not properly configured. Please contact
          support.
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

  // -- PayPal Button UI ----------------------------------------------------
  const buttonStyle: PayPalButtonsComponentProps['style'] = {
    layout: 'vertical',
    shape: 'rect',
    label: 'pay',
  };

  return (
    <div className="paypal-button-container">
      <div className="w-full min-h-[150px]">
        <PayPalButtons
          style={buttonStyle}
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
