// app/(protected)/profile/profile-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DETECTIVE_CASES } from '@/lib/detective-cases';
import { ErrorBoundary } from 'react-error-boundary';

interface PurchasedCase {
  case_id: string;
  purchase_date?: string;
}

interface ProfileClientProps {
  initialUserData: User | null;
  initialPurchasedCases: PurchasedCase[];
}

export default function ProfileClient({ 
  initialUserData, 
  initialPurchasedCases 
}: ProfileClientProps) {
  const router = useRouter();
  
  // Use initial data from server
  const [purchasedCases] = useState<PurchasedCase[]>(initialPurchasedCases);
  const [user] = useState<User | null>(initialUserData);

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-destructive">
          Failed to load profile details. Please try refreshing.
        </div>
      }
    >
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-4xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-8">Profile</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-2 text-muted-foreground">
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Last Sign In:</span> {new Date(user?.last_sign_in_at || '').toLocaleString()}</p>
              <p><span className="font-medium">Account Type:</span> {user?.app_metadata?.provider === 'google' ? 'Google Account' : 'Email Account'}</p>
            
              {user?.app_metadata?.provider !== 'google' && (
                <Button
                  onClick={() => router.push(`/reset-password?email=${encodeURIComponent(user?.email || '')}`)}
                  variant="outline"
                  className="mt-4"
                >
                  Reset Password
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Purchased Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Your Detective Cases</CardTitle>
            </CardHeader>
            
            <CardContent>
              {purchasedCases.length > 0 ? (
                <div className="space-y-4">
                  {purchasedCases.map(purchase => {
                    const detectiveCase = DETECTIVE_CASES.find(c => c.id === purchase.case_id);
                    if (!detectiveCase) return null;
                    
                    return (
                      <div key={purchase.case_id} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{detectiveCase.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Purchased on: {purchase.purchase_date ? 
                              new Date(purchase.purchase_date).toLocaleDateString() : 
                              'Unknown date'}
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push(`/cases/${purchase.case_id}`)}
                          size="sm"
                        >
                          View Case
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven&apos;t purchased any detective cases yet.</p>
                  <Button 
                    onClick={() => router.push('/cases')}
                    variant="default"
                  >
                    Browse Detective Cases
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}