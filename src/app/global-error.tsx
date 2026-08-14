'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h2>A fatal error occurred</h2>
        <p>Our engineering team has been notified and is working on it.</p>
        <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}>
          Refresh Page
        </button>
      </body>
    </html>
  );
}
