// app/cases/[id]/page.tsx
import type { Metadata } from "next";
import { getCachedCaseById, getCachedCases, getCaseById } from "@/lib/services/case-service";
import { getCaseMedia } from '@/lib/services/media-service';
import { createClient } from '@/utils/supabase/server';
import { generateProductSchema } from "@/utils/structured-data";
import CaseDetailView from "./case-detail-view";
import { Suspense } from "react";
import CaseDetailLoading from "./loading";
import { checkCaseAccess } from '@/lib/services/access-service';

// Update the type for generateMetadata to handle async params
export async function generateMetadata(
  { params: paramsPromise }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const params = await paramsPromise;
  const id = params.id;

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

// Update the page component props type and await params
export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }> // Type params as a Promise
}) {
  // Await the params promise first
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Fetch case and media data server-side in parallel
  const [detectiveCase, caseMedia] = await Promise.all([
    getCaseById(id, { isStatic: false }),
    getCaseMedia(id, { isStatic: false })
  ]);

  if (!detectiveCase) {
    // Handle case not found, maybe redirect or show a 404 page
    return <div>Case not found</div>; // Or use Next.js notFound()
  }
  
  // Check user access
  const supabase = await createClient(); // Use the server client and AWAIT
  const { data: authData } = await supabase.auth.getUser();
  
  // Fetch access status only if user is logged in
  let hasAccess = false;
  if (authData?.user?.id) {
    hasAccess = await checkCaseAccess(id, authData.user.id);
  }

  // Pass fetched data and initial access state to the client component
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
          initialCaseMedia={caseMedia} // Pass fetched media
          initialHasAccess={hasAccess} // Pass initial access status (already boolean)
          userId={authData?.user?.id} // Pass userId if available
        />
      </Suspense>
    </>
  );
}