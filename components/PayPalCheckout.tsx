// PayPalCheckout.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DetectiveCase } from '@/lib/detective-cases';
import { supabase } from '@/utils/supabase';

// Define PayPal SDK TypeScript interfaces
// This extends the Window interface to include the PayPal SDK
declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

// PayPal SDK types
interface PayPalNamespace {
  Buttons: (config: PayPalButtonsConfig) => PayPalButtonsComponent;
}

interface PayPalButtonsComponent {
  render: (container: HTMLElement) => void;
}

interface PayPalButtonsConfig {
  style: {
    shape: string;
    color: string;
    layout: string;
    label: string;
  };
  createOrder: (data: unknown, actions: PayPalOrderActions) => Promise<string>;
  onApprove: (data: PayPalApproveData, actions: PayPalOrderActions) => Promise<void>;
  onError: (error: Error) => void;
}

interface PayPalOrderActions {
  order: {
    create: (orderData: PayPalOrderData) => Promise<string>;
    capture: () => Promise<PayPalCaptureDetails>;
  };
}

interface PayPalOrderData {
  purchase_units: Array<{
    description: string;
    amount: {
      value: string;
      currency_code: string;
    };
  }>;
  application_context?: {
    shipping_preference: string;
  };
}

interface PayPalApproveData {
  orderID: string;
}

interface PayPalCaptureDetails {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface PayPalCheckoutProps {
  detectiveCase: DetectiveCase;
  onSuccess?: (details: PayPalCaptureDetails) => void;
  onError?: (error: Error) => void;
}

export function PayPalCheckout({ detectiveCase, onSuccess, onError }: PayPalCheckoutProps) {
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Clean up any previous PayPal scripts
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existingScript) {
      document.body.removeChild(existingScript);
    }

    // Load the PayPal SDK with explicit params
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=capture&debug=true`;
    script.async = true;
    script.dataset.sdkIntegrationSource = 'button-factory';

    // Add error handling for script loading
    script.onerror = () => {
      console.error('PayPal script failed to load');
      if (onError) {
        onError(new Error('PayPal script failed to load'));
      }
    };

    script.onload = () => {
      if (!paypalButtonRef.current || !window.paypal) {
        console.error('PayPal container or SDK not available');
        return;
      }

      // Clear any existing buttons
      paypalButtonRef.current.innerHTML = '';

      try {
        // Using ts-expect-error because the PayPal SDK types are complex and we're providing our own simplified version
        window.paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'blue',
            layout: 'vertical',
            label: 'pay',
          },
          // Set up the transaction
          createOrder: (_data: unknown, actions: PayPalOrderActions) => {
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
          // Finalize the transaction
          onApprove: async (data: PayPalApproveData, actions: PayPalOrderActions) => {
            try {
              const details = await actions.order.capture();
              console.log('Payment successful', details);
              
              if (user) {
                // Record the purchase in Supabase
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
                    onError(error);
                  }
                  return;
                }
              }
              
              if (onSuccess) {
                onSuccess(details);
              }
            } catch (err) {
              console.error('Payment error during capture:', err);
              if (onError && err instanceof Error) {
                onError(err);
              }
            }
          },
          onError: (err: Error) => {
            console.error('PayPal error:', err);
            if (onError) {
              onError(err);
            }
          }
        }).render(paypalButtonRef.current);
      } catch (err) {
        console.error('Error setting up PayPal buttons:', err);
        if (onError && err instanceof Error) {
          onError(err);
        }
      }
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
      <div ref={paypalButtonRef} className="w-full min-h-[150px] flex items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">Loading payment options...</div>
      </div>
      <div className="text-sm text-muted-foreground mt-2 text-center">
        Price: ${detectiveCase.price.toFixed(2)} USD
      </div>
    </div>
  );
}