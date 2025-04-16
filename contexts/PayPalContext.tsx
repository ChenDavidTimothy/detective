// contexts/PayPalContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

// Simple context with minimal required state
interface PayPalContextType {
  clientId: string;
}

const PayPalContext = createContext<PayPalContextType>({
  clientId: '',
});

export const usePayPal = () => useContext(PayPalContext);

interface PayPalProviderProps {
  children: React.ReactNode;
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  // Get client ID directly from env
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  // PayPal initialization options
  const paypalOptions = {
    'client-id': clientId,
    currency: 'USD',
    intent: 'capture',
    components: 'buttons',
    // Disable debug in production
    debug: process.env.NODE_ENV === 'development'
  };

  // Simple check if we have a client ID
  const hasValidClientId = !!clientId && clientId.length > 5;

  if (!hasValidClientId) {
    console.warn('PayPal client ID is missing or invalid. Payment functionality will be disabled.');
  }

  return (
    <PayPalContext.Provider value={{ clientId }}>
      {hasValidClientId ? (
        <PayPalScriptProvider options={paypalOptions}>
          {children}
        </PayPalScriptProvider>
      ) : (
        // Render children without the PayPal provider if client ID is missing
        children
      )}
    </PayPalContext.Provider>
  );
}