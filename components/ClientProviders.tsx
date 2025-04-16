// components/ClientProviders.tsx
'use client';

import { Analytics } from "@vercel/analytics/react";
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { PayPalProvider } from '@/contexts/PayPalContext';
import TopBar from '@/components/TopBar';
import { Toaster } from "@/components/ui/sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Analytics mode="auto" />
      <ThemeProvider>
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
function PayPalErrorFallback() {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <TopBar />
      <main>
        <h2>Something went wrong with PayPal services.</h2>
        <p>Please try again later or contact support.</p>
      </main>
      <Toaster />
    </div>
  );
}

// Simple error boundary component
function ErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
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
