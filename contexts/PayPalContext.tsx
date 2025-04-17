// contexts/PayPalContext.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { PayPalScriptProvider, ScriptProviderProps } from '@paypal/react-paypal-js';

interface PayPalProviderProps {
  children: ReactNode;
}

// Create a context to access PayPal configuration
interface PayPalContextValue {
  clientId: string;
}

const PayPalContext = createContext<PayPalContextValue>({
  clientId: '',
});

export function PayPalProvider({ children }: PayPalProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  
  // Configure PayPal script options per the official SDK
  const paypalOptions: ScriptProviderProps['options'] = {
    clientId,
    currency: 'USD',
    intent: 'capture',
    components: 'buttons',
  };

  return (
    <PayPalContext.Provider value={{ clientId }}>
      <PayPalScriptProvider options={paypalOptions}>
        {children}
      </PayPalScriptProvider>
    </PayPalContext.Provider>
  );
}

export function usePayPal() {
  return useContext(PayPalContext);
}