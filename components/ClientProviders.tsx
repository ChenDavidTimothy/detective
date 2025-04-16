// components/ClientProviders.tsx
'use client';

import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PayPalProvider } from '@/contexts/PayPalContext';
import TopBar from '@/components/TopBar';
import { Toaster } from "@/components/ui/sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Analytics mode="auto" />
      <ThemeProvider>
        {/* Wrap PayPalProvider with error boundary */}
        <ErrorBoundary fallback={<PayPalErrorFallback />}>
          <PayPalProvider>
            <TopBar />    
            <main>{children}</main>
            <Toaster />
          </PayPalProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </>
  );
}

// Error boundary for PayPal issues
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

function PayPalErrorFallback() {
  return (
    <>
      <TopBar />
      <main>
        {children}
      </main>
      <Toaster />
    </>
  );
}

// Simple error boundary component
function ErrorBoundary({ children, fallback }: { children: React.ReactNode, fallback: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      fallbackRender={() => fallback}
      onError={(error) => {
        console.error('Error in React component:', error);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}