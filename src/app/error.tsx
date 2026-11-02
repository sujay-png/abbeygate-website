'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  const handleRetry = () => {
    setRetrying(true);
    // Allow React state to update before invoking reset
    setTimeout(() => {
      reset();
    }, 150);
  };

  const handleHardReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <Container className="flex items-center justify-center min-h-[60vh] py-16">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-josefin text-brand-primary-dark">Something went wrong</h2>
          <p className="text-gray-600 font-work text-base">
            We encountered a temporary connection issue while loading this page. Our servers are syncing; please try again.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleRetry} disabled={retrying} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Connecting...' : 'Try again'}
          </Button>
          <Button variant="outline" onClick={handleHardReload} className="flex items-center justify-center gap-2">
            Reload page
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')} className="flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Go home
          </Button>
        </div>
      </div>
    </Container>
  );
}
