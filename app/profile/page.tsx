'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCaseAccess } from '@/hooks/useCaseAccess'; // Import our new hook
import { DETECTIVE_CASES } from '@/lib/detective-cases';
import { supabase } from '@/utils/supabase';

function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  // We'll fetch the user's purchased cases here
  const [purchasedCases, setPurchasedCases] = useState<string[]>([]);
  
  useEffect(() => {
    if (!user?.id) return;
    
    // Fetch user's purchased cases from Supabase
    const fetchPurchasedCases = async () => {
      try {
        const { data, error } = await supabase
          .from('user_purchases')
          .select('case_id')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Extract case IDs from the response
        const caseIds = data?.map(item => item.case_id) || [];
        setPurchasedCases(caseIds);
      } catch (err) {
        console.error('Error fetching purchased cases:', err);
      }
    };
    
    fetchPurchasedCases();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
          {paymentStatus === 'success' && (
            <div className="mb-8 p-4 bg-success/10 rounded-lg">
              <p className="text-success">
                🎉 Thank you for your purchase! Your payment was successful.
              </p>
            </div>
          )}
          
          <h1 className="text-3xl font-bold mb-8">Profile</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
            </CardHeader>
            
            {/* User Information */}
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
                  {purchasedCases.map(caseId => {
                    const detectiveCase = DETECTIVE_CASES.find(c => c.id === caseId);
                    if (!detectiveCase) return null;
                    
                    return (
                      <div key={caseId} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{detectiveCase.title}</h3>
                          <p className="text-sm text-muted-foreground">Purchased on: {/* You would need purchase date from DB */}</p>
                        </div>
                        <Button
                          onClick={() => router.push(`/cases/${caseId}`)}
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
                  <p className="text-muted-foreground mb-4">You haven't purchased any detective cases yet.</p>
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

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfileContent />
    </Suspense>
  );
}