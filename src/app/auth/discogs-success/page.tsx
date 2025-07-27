'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function DiscogsSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [canSell, setCanSell] = useState<boolean>(false);

  useEffect(() => {
    const user = searchParams.get('username');
    const userRole = searchParams.get('role');
    const userCanSell = searchParams.get('canSell') === 'true';
    
    if (user) setUsername(user);
    if (userRole) setRole(userRole);
    setCanSell(userCanSell);
  }, [searchParams]);

  const handleContinue = () => {
    // Redirect based on user type
    // For now, go to main page - we'll enhance this based on our auth strategy
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <div className="text-green-600 text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Successfully Connected!
        </h1>
        {username && (
          <div className="mb-6">
            <p className="text-gray-600 mb-3">
              Welcome, <span className="font-semibold text-gray-900">{username}</span>! 
              Your Discogs account is now connected.
            </p>
            
            {/* Role-specific information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Account Type:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  role === 'seller' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {role === 'seller' ? '🏪 Seller' : '🎵 Music Fan'}
                </span>
              </div>
              
              {role === 'seller' && canSell && (
                <div className="text-sm text-gray-600">
                  ✅ You can manage store inventory and sell records
                </div>
              )}
              
              {role === 'buyer' && (
                <div className="text-sm text-gray-600">
                  ✅ You can browse, wishlist, and purchase records
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {role === 'seller' ? 'Go to Store Management' : 'Start Discovering Music'}
          </button>
          
          <div className="text-sm text-gray-500">
            {role === 'seller' 
              ? 'You can now manage your inventory and sync with Discogs!'
              : 'You can now add items to your wishlist and sync with Discogs!'
            }
          </div>
          
          {role === 'buyer' && (
            <div className="text-xs text-gray-400 border-t pt-3">
              💡 Have a Discogs store? Connect with seller privileges to unlock store management features.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}