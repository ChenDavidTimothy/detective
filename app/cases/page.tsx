import type { Metadata } from "next";
import { Suspense } from "react";
import { getCachedCases } from "@/lib/services/case-service";
import CasesClient from "./cases-client";
import CasesLoading from "./loading";

export const metadata: Metadata = {
  title: "All Detective Cases",
  description: "Browse our collection of detective cases. Find mysteries ranging from easy to hard difficulty and start your investigation journey.",
  openGraph: {
    images: [
      {
        url: '/images/cases-og.png',
        width: 1200,
        height: 630,
        alt: 'Browse Detective Cases',
      },
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Detective Cases - Solve Mysteries Online',
      },
    ],
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/cases`,
  },
};

export default async function CasesPage() {
  // Fetch all cases from Supabase
  const cases = await getCachedCases();
  
  return (
    <Suspense fallback={<CasesLoading />}>
      {/* Pass cases to the client component */}
      <CasesClient initialCases={cases} />
    </Suspense>
  );
}