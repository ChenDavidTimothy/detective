import type { Metadata } from "next";
import LandingPageClient from "./landing-page-client";
import { generateOrganizationSchema, generateWebsiteSchema } from "@/utils/structured-data";

export const metadata: Metadata = {
  title: "Detective Cases - Solve Mysteries Online",
  description: "Explore and solve interactive detective cases. Purchase mysteries, analyze evidence, and become the detective in immersive online investigations.",
  openGraph: {
    images: [
      {
        url: '/images/home-og.png',
        width: 1200,
        height: 630,
        alt: 'Detective Cases - Solve Mysteries Online',
      },
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Detective Cases - Solve Mysteries Online',
      },
    ],
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOrganizationSchema())
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateWebsiteSchema())
        }}
      />
      <LandingPageClient />
    </>
  );
}