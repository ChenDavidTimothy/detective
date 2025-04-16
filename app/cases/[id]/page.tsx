// app/cases/[id]/page.tsx
import type { Metadata } from "next";
import { getCaseById, DETECTIVE_CASES } from "@/lib/detective-cases";
import { notFound } from "next/navigation";
import { createClient } from '@/utils/supabase/server';
import { generateProductSchema } from "@/utils/structured-data";
import CaseDetailView from "./case-detail-view";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Await the params object before accessing its properties
  const resolvedParams = await params;
  const detectiveCase = getCaseById(resolvedParams.id);
  
  if (!detectiveCase) {
    return {
      title: "Case Not Found",
      description: "The detective case you are looking for could not be found.",
    };
  }
  
  return {
    title: detectiveCase.title,
    description: detectiveCase.description,
    openGraph: {
      title: detectiveCase.title,
      description: detectiveCase.description,
      images: [detectiveCase.imageUrl || '/images/default-case-og.png'],
    },
    twitter: {
      card: "summary_large_image",
      title: detectiveCase.title,
      description: detectiveCase.description,
      images: [detectiveCase.imageUrl || '/images/default-case-og.png'],
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
  // Await the params object before accessing its properties
  const resolvedParams = await params;
  const caseId = resolvedParams.id;
  const detectiveCase = getCaseById(caseId);
  
  if (!detectiveCase) {
    notFound();
  }
  
  // Get user and check access
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  
  let hasAccess = false;
  
  if (user) {
    const { data: purchaseData } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('case_id', caseId)
      .maybeSingle();
      
    hasAccess = !!purchaseData;
  }
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateProductSchema(detectiveCase))
        }}
      />
      <CaseDetailView 
        detectiveCase={detectiveCase} 
        caseId={caseId} 
        initialHasAccess={hasAccess}
        userId={user?.id}
      />
    </>
  );
}