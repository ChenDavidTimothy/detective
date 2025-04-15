'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

// Define the context value type
type PayPalContextType = {
  initialized: boolean;
};

// Create context with default value
const PayPalContext = createContext<PayPalContextType>({
  initialized: false,
});

// Hook to use the PayPal context
export const usePayPal = () => useContext(PayPalContext);

// Base PayPal configuration
const paypalConfig = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  currency: "USD",
  intent: "capture",  
  components: "buttons",
  // Add these options for better reliability
  disableFunding: undefined,
  dataClientToken: undefined,
  dataNamespace: "paypal_sdk_" + Math.random().toString(36).substring(2, 15),
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
};

// PayPal provider component
export function PayPalProvider({ children }: { children: ReactNode }) {
  // We're indicating that PayPal is available through this provider
  const contextValue: PayPalContextType = {
    initialized: true,
  };

  return (
    <PayPalContext.Provider value={contextValue}>
      <PayPalScriptProvider options={paypalConfig}>
        {children}
      </PayPalScriptProvider>
    </PayPalContext.Provider>
  );
}