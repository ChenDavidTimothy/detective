// components/PaymentSuccessMessage.tsx
'use client';

import { useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface PaymentSuccessMessageProps {
  message?: string;
  redirectPath: string;
  redirectDelay?: number;
}

export function PaymentSuccessMessage({
  message = "Thank you for your purchase. You now have access to this content.",
  redirectPath,
  redirectDelay = 2500,
}: PaymentSuccessMessageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = redirectPath;
    }, redirectDelay);

    return () => clearTimeout(timer);
  }, [redirectPath, redirectDelay]);

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-500 rounded-lg p-8 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-green-700 dark:text-green-400 mb-2">
        Payment Successful!
      </h3>
      <p className="text-green-600 dark:text-green-400 mb-6">
        {message}
      </p>
      <p className="text-sm text-green-600/80 dark:text-green-400/80 mb-4">
        Redirecting to case details...
      </p>
      <div className="flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-green-500" />
      </div>
    </div>
  );
}
