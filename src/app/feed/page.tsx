'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ScrollableFeed from '@/components/ScrollableFeed';
import { DiscogsRelease } from '@/utils/discogs';

interface Store {
  id: string;
  username: string;
}

interface StoreInventoryResponse {
  results: DiscogsRelease[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
  };
  store: Store;
}

function FeedContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('store');
  
  const [releases, setReleases] = useState<DiscogsRelease[]>([]);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeedData();
  }, [storeId]);

  const loadFeedData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (storeId) {
        // Load specific store
        const response = await fetch(`/api/stores/${storeId}/inventory`);
        
        if (!response.ok) {
          throw new Error('Failed to load store inventory');
        }

        const data: StoreInventoryResponse = await response.json();
        console.log('Feed data loaded:', {
          resultsLength: data.results?.length,
          results: data.results,
          store: data.store
        });
        setReleases(data.results || []);
        setStoreInfo(data.store);
      } else {
        // Use default test store to show demo content
        const testStoreId = 'demo-store';
        const inventoryResponse = await fetch(`/api/stores/${testStoreId}/inventory`);
        if (inventoryResponse.ok) {
          const inventoryData: StoreInventoryResponse = await inventoryResponse.json();
          console.log('Feed data loaded (demo store):', {
            resultsLength: inventoryData.results?.length,
            results: inventoryData.results,
            store: inventoryData.store
          });
          setReleases(inventoryData.results || []);
          setStoreInfo(inventoryData.store);
        } else {
          throw new Error('Failed to load demo store inventory');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-lg">Loading your feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to load feed</h1>
          <p className="text-gray-300 mb-8">{error}</p>
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

  if (releases.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">No records found</h1>
          <p className="text-gray-300 mb-8">
            {storeInfo ? `${storeInfo.username} has no inventory available.` : 'No stores have been configured yet.'}
          </p>
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

  return <ScrollableFeed releases={releases} storeInfo={storeInfo || undefined} />;
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-lg">Loading your feed...</p>
        </div>
      </div>
    }>
      <FeedContent />
    </Suspense>
  );
}