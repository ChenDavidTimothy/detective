'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePayPal } from '@/contexts/PayPalContext';
import { DetectiveCase } from '@/lib/detective-cases';
import { supabase } from '@/utils/supabase';
import {
  PayPalButtons,
  usePayPalScriptReducer
} from "@paypal/react-paypal-js";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface PayPalCheckoutProps {
  detectiveCase: DetectiveCase;
  onSuccess?: (details: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

// Main component for PayPal checkout that uses the PayPal context
export function PayPalCheckout(props: PayPalCheckoutProps) {
  const { user } = useAuth();
  const { initialized } = usePayPal();
  
  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Please login to make a purchase
        </AlertDescription>
      </Alert>
    );
  }

  if (!initialized) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Payment system is not initialized. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="paypal-button-container">
      <div className="w-full min-h-[150px]">
        <PayPalButtonWrapper {...props} />
      </div>
      <div className="text-sm text-muted-foreground mt-2 text-center">
        Price: ${props.detectiveCase.price.toFixed(2)} USD
      </div>
    </div>
  );
}

// Separate component for the PayPal buttons to prevent unnecessary re-renders
function PayPalButtonWrapper({
  detectiveCase,
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Get the state from the PayPal Script context
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  // Reset error when price or component changes
  useEffect(() => {
    setLocalError(null);
  }, [detectiveCase.price]);

  // Memoize the createOrder function to avoid recreating it on every render
  const createOrder = useCallback((_data: unknown, actions: any) => {
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
        user_action: 'PAY_NOW', // Explicitly tell PayPal to show the Pay Now button
      },
    });
  }, [detectiveCase.title, detectiveCase.price]);

  // Function to save purchase to Supabase directly as a fallback
  const savePurchaseDirectly = useCallback(async (orderId: string) => {
    try {
      console.log('Attempting direct database save as fallback');
      if (!user?.id) throw new Error('User not found');
      
      const { error } = await supabase
        .from('user_purchases')
        .upsert(
          {
            user_id: user.id,
            case_id: detectiveCase.id,
            payment_id: orderId,
            amount: detectiveCase.price,
            // Add a note that this was saved directly, not through verification
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
  }, [user?.id, detectiveCase.id, detectiveCase.price]);

  // Memoize the onApprove function to avoid recreating it on every render
  const handleApprove = useCallback(async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      console.log('Payment approved, processing...');
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Payment processing timeout')), 30000)
      );
      
      // Race the capture against the timeout
      const details = await Promise.race([
        actions.order.capture(),
        timeoutPromise
      ]);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      console.log('Payment captured successfully, verifying with server...');
      
      // Use server-side API to verify and record purchase
      let verificationSuccess = false;
      try {
        const verifyResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: details.id,
            userId: user.id,
            caseId: detectiveCase.id,
            amount: detectiveCase.price,
          }),
        });
        
        // Check if the response is actually JSON
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
        // Instead of throwing, we'll try the fallback
        console.warn('Attempting fallback direct database save...');
        
        // Try the fallback direct save
        const fallbackSuccess = await savePurchaseDirectly(details.id);
        if (!fallbackSuccess) {
          // Even the fallback failed - but we won't throw an error
          // since the payment was successful in PayPal
          console.error('Both verification and fallback save failed');
        } else {
          verificationSuccess = true; // The fallback worked
          console.log('Fallback save successful');
        }
      }
      
      // The payment succeeded in PayPal, so we consider it a success
      // even if our verification had issues
      if (onSuccess) {
        onSuccess({
          ...details,
          verificationSuccess, // Additional flag to indicate if verification worked
        });
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      
      // Special handling for window closed error
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
  }, [user, detectiveCase.id, detectiveCase.price, onSuccess, onError, savePurchaseDirectly]);

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
        <AlertDescription>
          Failed to load PayPal. Please refresh the page and try again.
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