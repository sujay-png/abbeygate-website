import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold font-josefin text-black mb-4">404</h1>
      <h2 className="text-2xl font-semibold font-josefin text-gray-800 mb-6">Page Not Found</h2>
      <p className="text-gray-600 font-work max-w-md mx-auto mb-10 leading-relaxed">
        We couldn't find the page you were looking for. It might have been moved or doesn't exist.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button href="/" variant="primary">
          Return Home
        </Button>
        <Button href="/collection" variant="outline">
          Shop Collection
        </Button>
      </div>
    </div>
  );
}
