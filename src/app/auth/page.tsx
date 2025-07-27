'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function AuthPage() {
  const router = useRouter();

  const handleConnectDiscogs = () => {
    // Redirect to the Discogs OAuth initiation endpoint
    window.location.href = '/api/auth/discogs';
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Join the Beta
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect your Discogs account to get started with Rotation.
          </p>
          <p className="text-lg text-gray-600 mb-12">
            We&apos;ll use your Discogs connection to curate the perfect record discovery feed for you.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What happens next?
            </h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">1</span>
                <p className="text-gray-700">Connect your Discogs account securely</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">2</span>
                <p className="text-gray-700">We&apos;ll analyze your collection and wishlist</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">3</span>
                <p className="text-gray-700">Get personalized record recommendations</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">4</span>
                <p className="text-gray-700">Start discovering music with audio previews</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleConnectDiscogs}
              className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <span>🎵</span>
              <span>Connect Discogs Account</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              By connecting your Discogs account, you agree to our Terms of Service and Privacy Policy.
            </p>
            <p className="text-sm text-gray-500">
              We only access your public collection and wishlist data. We never modify your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}