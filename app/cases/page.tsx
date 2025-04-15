import type { Metadata } from "next";
import CasesClient from "./cases-client";

export const metadata: Metadata = {
  title: "All Detective Cases",
  description: "Browse our collection of detective cases. Find mysteries ranging from easy to hard difficulty and start your investigation journey.",
  openGraph: {
    images: ['/images/cases-og.png'],
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/cases`,
  },
};

export default function CasesPage() {
  return <CasesClient />;
}