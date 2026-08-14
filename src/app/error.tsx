'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <Container className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <h2 className="text-3xl font-bold font-josefin text-gray-900">Something went wrong</h2>
        <p className="text-gray-600 font-work text-lg">
          We&apos;re sorry, but an unexpected error occurred. Our team has been notified.
        </p>
        <div className="pt-4 flex gap-4 justify-center">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>Go home</Button>
        </div>
      </div>
    </Container>
  );
}
