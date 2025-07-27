'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function DiscogsConnectingPage() {
  const searchParams = useSearchParams();
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = searchParams.get('authUrl');
    const requestToken = searchParams.get('requestToken');
    const requestSecret = searchParams.get('requestSecret');

    if (url && requestToken && requestSecret) {
      setAuthUrl(url);
      // Store tokens for callback (in production, use secure session storage)
      sessionStorage.setItem('discogs_request_token', requestToken);
      sessionStorage.setItem('discogs_request_secret', requestSecret);
      
      // Automatically redirect to Discogs authorization
      window.location.href = url;
    } else {
      setError('Missing authorization parameters');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-red-600 text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connection Failed
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Connecting to Discogs...
        </h1>
        <p className="text-gray-600 mb-6">
          You&apos;re being redirected to Discogs to authorize your account.
        </p>
        {authUrl && (
          <a
            href={authUrl}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Click here if you&apos;re not redirected automatically
          </a>
        )}
      </div>
    </div>
  );
}