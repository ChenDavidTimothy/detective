import { Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BuyMeCoffee() {
  const COFFEE_URL = 'https://buy.stripe.com/5kA176bA895ggog4gh';

  return (
    <Button
      asChild
      variant="default"
      size="sm"
      className="hidden sm:flex"
    >
      <a 
        href={COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Coffee className="h-4 w-4 mr-2" />
        Buy Me a Coffee
      </a>
    </Button>
  );
}