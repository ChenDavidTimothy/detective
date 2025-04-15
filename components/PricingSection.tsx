import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const pricingTiers = [
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    interval: "/month",
    description: "Perfect for small teams and startups",
    features: [
      "All template features",
      "Priority support",
      "Custom branding",
      "Analytics dashboard",
      "Team collaboration"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$49",
    interval: "/month",
    description: "For larger organizations",
    features: [
      "Everything in Pro",
      "Advanced security",
      "Custom integrations",
      "24/7 support",
      "SLA guarantee"
    ],
    cta: "Start Trial",
    popular: true
  },
  {
    id: "custom",
    name: "Custom",
    price: "Custom",
    interval: "",
    description: "Tailored to your needs",
    features: [
      "Custom development",
      "Dedicated support",
      "Custom SLA",
      "On-premise options",
      "Training sessions"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export function PricingSection() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>("enterprise");

  const handleTierClick = (tierId: string) => {
    setSelectedTier(currentTier => currentTier === tierId ? null : tierId);
  };

  const handleCTAClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/profile');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
      {pricingTiers.map((tier) => (
        <Card 
          key={tier.name}
          className={`relative cursor-pointer transition-all duration-300 ${
            selectedTier === tier.id
              ? 'ring-2 ring-primary bg-primary/5 scale-105'
              : 'ring-1 ring-muted hover:ring-primary/50'
          }`}
          onClick={() => handleTierClick(tier.id)}
        >
          {tier.popular && (
            <Badge 
              className="absolute top-0 right-6 -translate-y-1/2" 
              variant="default"
            >
              Popular
            </Badge>
          )}
          
          <CardHeader>
            <CardTitle>{tier.name}</CardTitle>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold">{tier.price}</span>
              <span className="ml-1 text-muted-foreground">{tier.interval}</span>
            </div>
            <CardDescription>{tier.description}</CardDescription>
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-4">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-3" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          
          <CardFooter>
            <Button
              onClick={handleCTAClick}
              className="w-full"
              variant={selectedTier === tier.id ? "default" : "outline"}
            >
              {tier.cta}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}