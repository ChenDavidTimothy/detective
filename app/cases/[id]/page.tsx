// app/cases/[id]/page.tsx
import type { Metadata } from "next";
import { getCaseById, DETECTIVE_CASES } from "@/lib/detective-cases";
import { notFound } from "next/navigation";
import { createClient } from '@/utils/supabase/server';
import { generateProductSchema } from "@/utils/structured-data";
import CaseDetailView from "./case-detail-view";
import { Suspense } from "react";
import CaseDetailLoading from "./loading";

type Props = {
  params: Promise<{ id: string }>;
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
  const resolvedParams = await params;
  const detectiveCase = getCaseById(resolvedParams.id);
  
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
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/cases/${resolvedParams.id}`,
    },
  };
}

export function generateStaticParams() {
  return DETECTIVE_CASES.map((detectiveCase) => ({
    id: detectiveCase.id,
  }));
}

export default async function CaseDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const caseId = resolvedParams.id;
  const detectiveCase = getCaseById(caseId);
  
  if (!detectiveCase) {
    notFound();
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const accessData = await checkCaseAccess(caseId, authData?.user?.id);
  
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
          caseId={caseId} 
          initialHasAccess={accessData.hasAccess}
          userId={authData?.user?.id}
        />
      </Suspense>
    </>
  );
}