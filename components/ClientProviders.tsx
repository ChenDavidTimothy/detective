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
        <PayPalProvider>
          <TopBar />    
          <main>{children}</main>
          <Toaster />
        </PayPalProvider>
      </ThemeProvider>
    </>
  );
}