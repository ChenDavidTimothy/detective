// contexts/PayPalContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

// Context provides clientId if needed elsewhere in the app
interface PayPalContextType {
  clientId: string;
}

const PayPalContext = createContext<PayPalContextType>({ clientId: '' });

export const usePayPal = () => useContext(PayPalContext);

interface PayPalProviderProps {
  children: React.ReactNode;
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  // Use correct key for PayPalScriptProvider options
  const paypalOptions = {
    clientId, // camelCase, as required by types
    currency: 'USD',
    intent: 'capture',
    components: 'buttons',
    debug: process.env.NODE_ENV === 'development',
  };

  const hasValidClientId = Boolean(clientId);

  if (!hasValidClientId) {
    console.warn(
      'PayPal client ID is missing. Payment functionality will be disabled.'
    );
  }

  return (
    <PayPalContext.Provider value={{ clientId }}>
      {hasValidClientId ? (
        <PayPalScriptProvider options={paypalOptions}>
          {children}
        </PayPalScriptProvider>
      ) : (
        // If clientId is missing, render children without PayPal provider
        children
      )}
    </PayPalContext.Provider>
  );
}
