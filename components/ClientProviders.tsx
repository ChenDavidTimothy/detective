'use client';

import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/contexts/ProtectedRoute';
import TopBar from '@/components/TopBar';

/**
 * ClientProviders component wraps all client-side context providers
 * This allows the root layout to be a server component while
 * still providing all the necessary client-side context
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Analytics mode="auto" />
      <ThemeProvider>
        <AuthProvider>   
          <ProtectedRoute>
            <TopBar />    
            <main>{children}</main>
          </ProtectedRoute>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}