'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DetectiveCase } from '@/lib/detective-cases';
import { supabase } from '@/utils/supabase';
import {
  PayPalScriptProvider,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PayPalCheckoutProps {
  detectiveCase: DetectiveCase;
  onSuccess?: (details: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

export function PayPalCheckout({
  detectiveCase,
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const { user } = useAuth();
  const [buttonError, setButtonError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // <-- Loading state

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Please login to make a purchase
        </AlertDescription>
      </Alert>
    );
  }

  if (buttonError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {buttonError || 'Failed to load payment options. Please try again later.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="paypal-button-container">
      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
          currency: "USD",
          intent: "capture",
          components: "buttons",
        }}
      >
        <div className="w-full min-h-[150px]">
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect" }}
            disabled={isLoading} // <-- Disable button while loading
            forceReRender={[
              detectiveCase.price,
              isLoading,
            ]} // <-- Ensures button updates if price/loading changes
            createOrder={(_data: unknown, actions: any) => {
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
                },
              });
            }}
            onApprove={async (_data: unknown, actions: any) => {
              setIsLoading(true); // <-- Start loading
              try {
                const details = await actions.order.capture();
                if (user) {
                  const { error } = await supabase
                    .from('user_purchases')
                    .upsert(
                      {
                        user_id: user.id,
                        case_id: detectiveCase.id,
                        payment_id: details.id,
                        amount: detectiveCase.price,
                      },
                      { onConflict: 'user_id,case_id' }
                    );
                  if (error && onError) {
                    onError(new Error(error.message || 'Failed to record purchase'));
                    setIsLoading(false); // <-- Stop loading on error
                    return;
                  }
                }
                if (onSuccess) onSuccess(details);
              } catch (err) {
                setButtonError('Payment processing failed. Please try again.');
                if (onError) {
                  onError(
                    err instanceof Error
                      ? err
                      : new Error('Payment capture failed')
                  );
                }
              } finally {
                setIsLoading(false); // <-- Always stop loading
              }
            }}
            onError={(err: unknown) => {
              setButtonError('Payment system error. Please try again.');
              setIsLoading(false); // <-- Stop loading on error
              if (onError)
                onError(
                  err instanceof Error
                    ? err
                    : new Error('PayPal error')
                );
            }}
            onCancel={() => {
              setIsLoading(false); // <-- Stop loading if cancelled
              console.log('Payment cancelled');
            }}
          />
          {isLoading && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Processing payment, please wait...
            </div>
          )}
        </div>
      </PayPalScriptProvider>
      <div className="text-sm text-muted-foreground mt-2 text-center">
        Price: ${detectiveCase.price.toFixed(2)} USD
      </div>
    </div>
  );
}
