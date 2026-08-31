'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { processLinkOrdersToken } from '@/features/account/services/link-orders';
import { Container } from '@/components/ui/Container';

function VerifyOrdersHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(!token ? 'error' : 'loading');
  const [message, setMessage] = useState(!token ? 'Invalid or missing verification token.' : '');

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const linkOrders = async () => {
      const result = await processLinkOrdersToken(token);
      if (isMounted) {
        if (result.success) {
          setStatus('success');
          setMessage(result.message);
        } else {
          setStatus('error');
          setMessage(result.message || 'Failed to verify token.');
        }
      }
    };

    linkOrders();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#3498db] rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Linking your past orders...</h2>
        <p className="text-gray-500 mt-2">Please wait a moment while we securely process your request.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-8 py-12 rounded-lg text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Success!</h2>
        <p className="mb-8 text-green-800">{message}</p>
        <Link 
          href="/account/orders"
          className="inline-flex h-11 px-8 bg-brand-primary text-white text-[15px] font-medium rounded-md hover:bg-brand-primary-dark transition-all duration-200 items-center justify-center"
        >
          View My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-8 py-12 rounded-lg text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold mb-2">Verification Failed</h2>
      <p className="mb-8 text-red-800">{message}</p>
      <Link 
        href="/account/orders"
        className="inline-flex h-11 px-8 bg-brand-primary text-white text-[15px] font-medium rounded-md hover:bg-brand-primary-dark transition-all duration-200 items-center justify-center"
      >
        Return to Orders
      </Link>
    </div>
  );
}

export default function VerifyOrdersPage() {
  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Container className="py-16 md:py-24 flex items-center justify-center min-h-[60vh]">
        <div className="w-full">
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <VerifyOrdersHandler />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
