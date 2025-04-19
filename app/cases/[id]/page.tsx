// app/cases/[id]/page.tsx
import type { Metadata } from "next";
import { getCachedCaseById, getCachedCases } from "@/lib/services/case-service";
import { notFound } from "next/navigation";
import { createClient } from '@/utils/supabase/server';
import { generateProductSchema } from "@/utils/structured-data";
import CaseDetailView from "./case-detail-view";
import { Suspense } from "react";
import CaseDetailLoading from "./loading";

type Props = {
  params: { id: string };
};

// Server action for checking case access
async function checkCaseAccess(caseId: string, userId?: string) {
  if (!userId) return { hasAccess: false };
  
  const supabase = await createClient();
  const { data: purchaseData } = await supabase
    .from('user_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('case_id', caseId)
    .maybeSingle();
    
  return { hasAccess: !!purchaseData };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id; // Use params directly

  const detectiveCase = await getCachedCaseById(id);
  
  if (!detectiveCase) {
    return {
      title: "Case Not Found",
      description: "The detective case you are looking for could not be found.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }
  
  return {
    title: detectiveCase.title,
    description: detectiveCase.description,
    openGraph: {
      title: detectiveCase.title,
      description: detectiveCase.description,
      images: [
        ...(detectiveCase.imageUrl ? [{
          url: detectiveCase.imageUrl,
          width: 1200,
          height: 630,
          alt: detectiveCase.title,
        }] : []),
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'Detective Cases - Solve Mysteries Online',
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: detectiveCase.title,
      description: detectiveCase.description,
      images: [
        ...(detectiveCase.imageUrl ? [detectiveCase.imageUrl] : []),
        '/opengraph-image',
      ],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/cases/${id}`,
    },
  };
}

export async function generateStaticParams() {
  // Pass isStatic: true to ensure the static client is used
  const cases = await getCachedCases({ isStatic: true }); 
  return cases.map((detectiveCase) => ({
    id: detectiveCase.id,
  }));
}

export default async function CaseDetailPage({ params }: Props) {
  const id = params.id; // Use params directly

  // Default isStatic is false, so no need to pass it here for request time
  const detectiveCase = await getCachedCaseById(id);
  
  if (!detectiveCase) {
    notFound();
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const accessData = await checkCaseAccess(id, authData?.user?.id);
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateProductSchema(detectiveCase))
        }}
      />
      <Suspense fallback={<CaseDetailLoading />}>
        <CaseDetailView 
          detectiveCase={detectiveCase} 
          caseId={id} 
          initialHasAccess={accessData.hasAccess}
          userId={authData?.user?.id}
        />
      </Suspense>
    </>
  );
}