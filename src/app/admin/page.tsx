'use client';

// import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

interface Store {
  id: string;
  username: string;
  addedAt: string;
  stats?: {
    collectionCount: number;
    views: number;
    wishlists: number;
    sales: number;
    audioMatchPercentage: number;
    lastSync?: string;
  };
}

// Generate mock stats for stores
const generateMockStats = (username: string, addedAt: string) => {
  const daysSinceAdded = Math.floor((Date.now() - new Date(addedAt).getTime()) / (1000 * 60 * 60 * 24));
  const baseMultiplier = Math.max(1, daysSinceAdded / 30); // More activity for older stores
  
  const statsMap: Record<string, any> = {
    'fanatico_records': {
      collectionCount: 2847,
      views: Math.floor(12340 * baseMultiplier),
      wishlists: Math.floor(580 * baseMultiplier),
      sales: Math.floor(127 * baseMultiplier),
      audioMatchPercentage: 78,
      lastSync: '2 hours ago'
    },
    'rough_trade': {
      collectionCount: 15420,
      views: Math.floor(45200 * baseMultiplier),
      wishlists: Math.floor(2150 * baseMultiplier),
      sales: Math.floor(890 * baseMultiplier),
      audioMatchPercentage: 65,
      lastSync: '1 hour ago'
    },
    'amoeba_music': {
      collectionCount: 45000,
      views: Math.floor(89000 * baseMultiplier),
      wishlists: Math.floor(4200 * baseMultiplier),
      sales: Math.floor(1560 * baseMultiplier),
      audioMatchPercentage: 45,
      lastSync: '30 minutes ago'
    },
    'sounds_of_the_universe': {
      collectionCount: 3200,
      views: Math.floor(8900 * baseMultiplier),
      wishlists: Math.floor(420 * baseMultiplier),
      sales: Math.floor(89 * baseMultiplier),
      audioMatchPercentage: 82,
      lastSync: '4 hours ago'
    }
  };
  
  return statsMap[username] || {
    collectionCount: Math.floor(Math.random() * 5000) + 100,
    views: Math.floor(Math.random() * 10000) + 500,
    wishlists: Math.floor(Math.random() * 500) + 50,
    sales: Math.floor(Math.random() * 100) + 10,
    audioMatchPercentage: Math.floor(Math.random() * 40) + 50,
    lastSync: `${Math.floor(Math.random() * 12) + 1} hours ago`
  };
};

export default function AdminPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [newStoreUsername, setNewStoreUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const response = await fetch('/api/admin/stores');
      if (response.ok) {
        const data = await response.json();
        const storesWithStats = (data.stores || []).map((store: Store) => ({
          ...store,
          stats: generateMockStats(store.username, store.addedAt)
        }));
        setStores(storesWithStats);
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const addStore = async () => {
    if (!newStoreUsername.trim()) {
      setError('Store username is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newStoreUsername.trim() }),
      });

      if (response.ok) {
        setNewStoreUsername('');
        loadStores();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add store');
      }
    } catch (error) {
      setError('Failed to add store');
    } finally {
      setLoading(false);
    }
  };

  const removeStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to remove this store?')) return;

    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadStores();
      } else {
        setError('Failed to remove store');
      }
    } catch (error) {
      setError('Failed to remove store');
    }
  };

  // Skip auth check for development
  // if (!user) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/20 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-white/70 mt-1">Manage stores and monitor the platform</p>
            </div>
            <button
              onClick={() => window.location.href = '/feed'}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← Back to Feed
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">{stores.length}</div>
            <div className="text-white/70">Total Stores</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">
              {stores.filter(s => new Date(s.addedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </div>
            <div className="text-white/70">Added This Week</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">Active</div>
            <div className="text-white/70">System Status</div>
          </div>
        </div>
        
        {/* Add Store Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">
            Add New Store
          </h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={newStoreUsername}
              onChange={(e) => setNewStoreUsername(e.target.value)}
              placeholder="Enter Discogs store username"
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              onKeyDown={(e) => e.key === 'Enter' && addStore()}
            />
            <button
              onClick={addStore}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? 'Adding...' : 'Add Store'}
            </button>
          </div>
          
          {error && (
            <div className="text-red-400 text-sm mb-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          )}
          
          <p className="text-sm text-white/60">
            Enter the Discogs username of a store with marketplace inventory. The store will be validated and added to the platform.
          </p>
        </div>

        {/* Stores List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">
              Managed Stores ({stores.length})
            </h2>
          </div>
          
          {stores.length === 0 ? (
            <div className="px-6 py-12 text-center text-white/60">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-lg font-medium text-white/80 mb-2">No stores added yet</h3>
              <p>Add a store above to start building your platform</p>
            </div>
          ) : (
            <div className="divide-y divide-white/20">
              {stores.map((store) => (
                <div key={store.id} className="px-6 py-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-medium text-white text-xl">
                          @{store.username}
                        </div>
                        <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs border border-green-500/30">
                          Active
                        </span>
                      </div>
                      <div className="text-sm text-white/60 mb-4">
                        Added {new Date(store.addedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} • Last sync: {store.stats?.lastSync || 'Never'}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => window.open(`/feed?store=${store.id}`, '_blank')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
                      >
                        View Feed
                      </button>
                      <button
                        onClick={() => window.open(`/stores/${store.id}`, '_blank')}
                        className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/30 transition-colors font-medium"
                      >
                        Manage Store
                      </button>
                      <button
                        onClick={() => removeStore(store.id)}
                        className="text-red-400 hover:text-red-300 px-3 py-2 text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Store Stats Grid */}
                  {store.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-lg font-bold text-white">
                          {store.stats.collectionCount.toLocaleString()}
                        </div>
                        <div className="text-white/60 text-xs">Collection #</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-lg font-bold text-white">
                          {store.stats.views.toLocaleString()}
                        </div>
                        <div className="text-white/60 text-xs">Views</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-lg font-bold text-white">
                          {store.stats.wishlists.toLocaleString()}
                        </div>
                        <div className="text-white/60 text-xs">Wishlists</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-lg font-bold text-white">
                          {store.stats.sales.toLocaleString()}
                        </div>
                        <div className="text-white/60 text-xs">Sales</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-lg font-bold text-white">
                          {store.stats.audioMatchPercentage}%
                        </div>
                        <div className="text-white/60 text-xs">Audio Match</div>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-white/50">
                      Store ID: {store.id}
                    </div>
                    <div className="flex items-center gap-4 text-white/50">
                      <button
                        onClick={() => window.open(`https://www.discogs.com/user/${store.username}/inventory`, '_blank')}
                        className="hover:text-white/80 transition-colors"
                      >
                        View on Discogs ↗
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}