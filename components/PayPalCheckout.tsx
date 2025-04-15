// components/PayPalCheckout.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DetectiveCase } from '@/lib/detective-cases';
import { supabase } from '@/utils/supabase';
import { 
  PayPalScriptProvider, 
  PayPalButtons,
  type OnApproveData,
  type OnApproveActions,
  type CreateOrderActions
} from "@paypal/react-paypal-js";
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PayPalCheckoutProps {
  detectiveCase: DetectiveCase;
  onSuccess?: (details: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

export function PayPalCheckout({ detectiveCase, onSuccess, onError }: PayPalCheckoutProps) {
  const { user } = useAuth();
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [buttonError, setButtonError] = useState<string | null>(null);

  if (!user) return <div>Please login to make a purchase</div>;

  // Show any errors
  if (scriptError || buttonError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {scriptError || buttonError || 'Failed to load payment options. Please try again later.'}
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
          components: "buttons"
        }}
      >
        <div className="w-full min-h-[150px]">
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect" }}
            createOrder={(_data, actions: CreateOrderActions) => {
              return actions.order.create({
                purchase_units: [{
                  description: `Detective Case: ${detectiveCase.title}`,
                  amount: {
                    value: detectiveCase.price.toFixed(2),
                    currency_code: 'USD'
                  }
                }],
                application_context: {
                  shipping_preference: 'NO_SHIPPING'
                }
              });
            }}
            onApprove={async (data: OnApproveData, actions: OnApproveActions) => {
              try {
                const details = await actions.order.capture();
                console.log('Payment successful', details);
                
                // Record the purchase in Supabase
                if (user) {
                  const { error } = await supabase
                    .from('user_purchases')
                    .upsert({
                      user_id: user.id,
                      case_id: detectiveCase.id,
                      payment_id: details.id || data.orderID,
                      amount: detectiveCase.price
                    }, {
                      onConflict: 'user_id,case_id'
                    });
                    
                  if (error) {
                    console.error('Error recording purchase:', error);
                    if (onError) {
                      onError(new Error(error.message || 'Failed to record purchase'));
                    }
                    return;
                  }
                }
                
                if (onSuccess) {
                  onSuccess(details);
                }
              } catch (err) {
                console.error('Payment error during capture:', err);
                setButtonError('Payment processing failed. Please try again.');
                if (onError) {
                  onError(err instanceof Error ? err : new Error('Payment capture failed'));
                }
              }
            }}
            onError={(err) => {
              console.error('PayPal button error:', err);
              setButtonError('Payment system error. Please try again.');
              if (onError) onError(new Error(err?.message || 'PayPal error'));
            }}
            onCancel={() => console.log('Payment cancelled')}
          />
        </div>
      </PayPalScriptProvider>
      <div className="text-sm text-muted-foreground mt-2 text-center">
        Price: ${detectiveCase.price.toFixed(2)} USD
      </div>
    </div>
  );
}