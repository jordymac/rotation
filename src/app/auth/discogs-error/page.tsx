'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DiscogsErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('Authentication failed');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  const handleRetry = () => {
    window.location.href = '/api/auth/discogs';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <div className="text-red-600 text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Connection Failed
        </h1>
        <p className="text-gray-600 mb-6">
          {error}
        </p>
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full text-gray-600 hover:text-gray-900 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DiscogsErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <DiscogsErrorContent />
    </Suspense>
  );
}