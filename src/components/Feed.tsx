'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DiscogsRelease, getStoreInventory } from '@/utils/discogs';
import RecordCard from './RecordCard';
import Link from 'next/link';

export default function Feed() {
  const { user, isLoaded } = useUser();
  const [releases, setReleases] = useState<DiscogsRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const loadReleases = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (user) {
          const data = await getStoreInventory();
          setReleases(data.results);
        } else {
          setReleases([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load store inventory');
      } finally {
        setLoading(false);
      }
    };

    loadReleases();
  }, [isLoaded, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Rotation
        </h1>
        <p className="text-gray-600 mb-8">
          Showcase your record store inventory in a beautiful scrollable feed.
        </p>
        <p className="text-gray-500">
          Sign in to connect your Discogs store and start displaying your inventory.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Your Store
        </h1>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          {error.includes('No Discogs store configured') ? (
            <Link
              href="/profile"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Set Up Your Store
            </Link>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Your Store
        </h1>
        <Link
          href="/profile"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          Store Settings
        </Link>
      </div>
      
      {releases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            No items found in your store inventory.
          </p>
          <p className="text-gray-400 text-sm">
            Make sure you have items listed for sale on Discogs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {releases.map((release) => (
            <RecordCard key={release.id} release={release} />
          ))}
        </div>
      )}
    </div>
  );
}