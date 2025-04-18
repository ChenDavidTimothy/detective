// app/layout.tsx
import { Geist } from "next/font/google";
import "./globals.css";
import { ClientProviders } from '@/components/ClientProviders';
import type { Metadata, Viewport } from "next";

const geist = Geist({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export const metadata: Metadata = {
  title: {
    template: "%s | Detective Cases",
    default: "Detective Cases - Solve Mysteries Online"
  },
  description: "Explore and solve interactive detective cases. Purchase mysteries, analyze evidence, and become the detective in immersive online investigations.",
  keywords: ["detective", "mystery", "cases", "online detective", "solve mysteries"],
  authors: [{ name: "Detective Cases Team" }],
  creator: "Detective Cases",
  publisher: "Detective Cases",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Detective Cases - Solve Mysteries Online",
    description: "Explore and solve interactive detective cases. Purchase mysteries, analyze evidence, and become the detective in immersive online investigations.",
    url: "/",
    siteName: "Detective Cases",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Detective Cases - Solve Mysteries Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Detective Cases - Solve Mysteries Online",
    description: "Explore and solve interactive detective cases. Purchase mysteries, analyze evidence, and become the detective in immersive online investigations.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-vercel.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geist.className}>
      <body className="bg-background text-foreground" suppressHydrationWarning={true}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}