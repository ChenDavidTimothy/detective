'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

/**
 * A simple tool to check if the payment verification endpoint is working
 * You can use this in development to diagnose API issues
 */
export function VerificationChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const checkEndpoint = async () => {
    setIsChecking(true);
    setResult(null);
    
    try {
      // First try a GET request to see if the endpoint is reachable
      const getResponse = await fetch('/api/payments/verify', {
        method: 'GET',
      });
      
      const getResult = await getResponse.text();
      console.log('GET response:', getResult);
      
      // Then try a POST with test data
      const postResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: 'test-order-' + Date.now(),
          userId: 'test-user-id',
          caseId: 'test-case-id',
          amount: 9.99,
        }),
      });
      
      // This should fail with a validation error, but the endpoint should be reachable
      const postResult = await postResponse.text();
      console.log('POST response:', postResult);
      
      // Check if we can parse the responses as JSON
      try {
        JSON.parse(getResult);
        JSON.parse(postResult);
        setResult({
          success: true,
          message: 'Endpoint is reachable and returns valid JSON responses.',
        });
      } catch (e) {
        setResult({
          success: false,
          message: 'Endpoint is reachable but returns non-JSON responses.',
        });
      }
    } catch (error) {
      console.error('Error checking endpoint:', error);
      setResult({
        success: false,
        message: `Endpoint check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Verification Endpoint Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Use this tool to check if your payment verification endpoint is working correctly.
        </p>
        
        <Button
          onClick={checkEndpoint}
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Endpoint'
          )}
        </Button>
        
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p>Note: Remove this component in production.</p>
        </div>
      </CardContent>
    </Card>
  );
}