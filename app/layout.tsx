import { Geist } from "next/font/google";
import "./globals.css";
import { ClientProviders } from '@/components/ClientProviders';

const geist = Geist({ subsets: ['latin'] });

/**
 * Root layout is now a server component (no 'use client' directive)
 * This allows Next.js to pre-render the basic HTML structure
 * while delegating client-specific logic to ClientProviders
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-background text-foreground`} suppressHydrationWarning={true}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}