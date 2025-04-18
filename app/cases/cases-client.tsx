'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DETECTIVE_CASES } from '@/lib/detective-cases';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CasesClient() {
  const router = useRouter();

  // Prefetch case details on hover
  const handleMouseEnter = (caseId: string) => {
    router.prefetch(`/cases/${caseId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Detective Cases</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DETECTIVE_CASES.map((detectiveCase) => (
            <Card 
              key={detectiveCase.id} 
              className="flex flex-col hover:shadow-lg transition-shadow duration-200"
              onMouseEnter={() => handleMouseEnter(detectiveCase.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{detectiveCase.title}</CardTitle>
                  <Badge 
                    variant={
                      detectiveCase.difficulty === 'easy' ? 'default' : 
                      detectiveCase.difficulty === 'medium' ? 'secondary' : 
                      'destructive'
                    }
                  >
                    {detectiveCase.difficulty}
                  </Badge>
                </div>
                <CardDescription>
                  ${detectiveCase.price.toFixed(2)} USD
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{detectiveCase.description}</p>
              </CardContent>
              
              <CardFooter>
                <Button 
                  onClick={() => router.push(`/cases/${detectiveCase.id}`)}
                  className="w-full"
                >
                  View Case
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}