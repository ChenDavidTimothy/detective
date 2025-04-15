// Create file: /components/PayPalCheckout.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DetectiveCase } from '@/lib/detective-cases';
import { supabase } from '@/utils/supabase';

interface PayPalCheckoutProps {
  detectiveCase: DetectiveCase;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
}

export function PayPalCheckout({ detectiveCase, onSuccess, onError }: PayPalCheckoutProps) {
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Load the PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
    script.async = true;

    script.onload = () => {
      if (!paypalButtonRef.current || !window.paypal) return;

      // Clear any existing buttons
      paypalButtonRef.current.innerHTML = '';

      // @ts-ignore - PayPal types not defined
      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
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
        },
        onApprove: async (data: any, actions: any) => {
          try {
            // Capture the funds from the transaction
            const details = await actions.order.capture();
            console.log('Payment successful', details);
            
            if (user) {
              // Record the purchase in Supabase
              const { error } = await supabase
                .from('user_purchases')
                .upsert({
                  user_id: user.id,
                  case_id: detectiveCase.id,
                  payment_id: details.id,
                  amount: detectiveCase.price
                }, {
                  onConflict: 'user_id,case_id'
                });
                
              if (error) {
                console.error('Error recording purchase:', error);
                onError && onError(error);
                return;
              }
            }
            
            onSuccess && onSuccess(details);
          } catch (err) {
            console.error('Payment error:', err);
            onError && onError(err);
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          onError && onError(err);
        }
      }).render(paypalButtonRef.current);
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [detectiveCase, user, onSuccess, onError]);

  if (!user) return <div>Please login to make a purchase</div>;

  return (
    <div className="paypal-button-container">
      <div ref={paypalButtonRef}></div>
      <div className="text-sm text-muted-foreground mt-2">
        Price: ${detectiveCase.price.toFixed(2)} USD
      </div>
    </div>
  );
}