import { DetectiveCase } from "@/lib/detective-cases";

export function generateProductSchema(detectiveCase: DetectiveCase) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: detectiveCase.title,
    description: detectiveCase.description,
    image: detectiveCase.imageUrl || "/images/default-case.jpg",
    offers: {
      "@type": "Offer",
      price: detectiveCase.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Detective Cases",
    url: process.env.NEXT_PUBLIC_APP_URL,
    logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    sameAs: [
      "https://twitter.com/detectivecases",
      "https://facebook.com/detectivecases",
      "https://instagram.com/detectivecases",
    ],
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Detective Cases",
    url: process.env.NEXT_PUBLIC_APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${process.env.NEXT_PUBLIC_APP_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
