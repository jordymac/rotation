import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input, Card, H2, H3, P, Badge } from '@/components/atoms';
import { StatsCard } from '@/components/molecules';
import { getStoreMetrics } from '@/lib/analytics';

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
  statsLoading?: boolean;
  statsError?: boolean;
}

interface StoreManagementProps {
  className?: string;
}

// Fetch real stats using new analytics system
const fetchRealStats = async (username: string) => {
  try {
    return await getStoreMetrics(username);
  } catch (error) {
    console.error(`Error fetching stats for ${username}:`, error);
    throw error; // Let component handle the error state
  }
};

export const StoreManagement: React.FC<StoreManagementProps> = ({
  className
}) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [newStoreUsername, setNewStoreUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  // Fetch real stats for all stores
  const fetchStatsForAllStores = async (storeList: Store[]) => {
    const storesWithStats = await Promise.all(
      storeList.map(async (store) => {
        try {
          const stats = await fetchRealStats(store.username);
          return {
            ...store,
            stats,
            statsLoading: false,
            statsError: false
          };
        } catch (error) {
          return {
            ...store,
            statsLoading: false,
            statsError: true
          };
        }
      })
    );
    return storesWithStats;
  };


  const loadStores = async () => {
    try {
      const response = await fetch('/api/admin/stores');
      if (response.ok) {
        const data = await response.json();
        const storesWithRealStats = await fetchStatsForAllStores(data.stores || []);
        setStores(storesWithRealStats);
      } else {
        console.error('API response not ok:', response.status, response.statusText);
        setStores([]);
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
      setStores([]);
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

  return (
    <div className={cn('space-y-8', className)}>
      {/* System Update Notice */}
      <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm border-green-500/30 p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🚀</div>
          <div>
            <H3 className="text-green-400 font-semibold mb-1">New Inbox-Style Review System</H3>
            <P className="text-white/80 text-sm mt-0">
              Store management now uses a high-efficiency 3-pane inbox with ≥80% auto-approval, 
              keyboard shortcuts (J/K/A/R/N), and bulk actions. Same URLs, dramatically faster workflow.
            </P>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Stores"
          value={stores.length}
        />
        <StatsCard
          title="Added This Week"
          value={stores.filter(s => new Date(s.addedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
        />
        <StatsCard
          title="System Status"
          value="Active"
        />
      </div>
      
      {/* Add Store Form */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
        <H2 className="text-xl font-semibold text-white mb-4">
          Add New Store
        </H2>
        
        <div className="flex gap-4 mb-4">
          <Input
            type="text"
            value={newStoreUsername}
            onChange={(e) => setNewStoreUsername(e.target.value)}
            placeholder="Enter Discogs store username"
            className="flex-1 px-3 py-2 bg-white/10 border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
            onKeyDown={(e) => e.key === 'Enter' && addStore()}
          />
          <Button
            onClick={addStore}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {loading ? 'Adding...' : 'Add Store'}
          </Button>
        </div>
        
        {error && (
          <div className="text-red-400 text-sm mb-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            {error}
          </div>
        )}
        
        <P className="text-sm text-white/60 mt-0">
          Enter the Discogs username of a store with marketplace inventory. The store will be validated and added to the platform.
        </P>
      </Card>

      {/* Stores List */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <div className="px-6 py-4 border-b border-white/20">
          <H2 className="text-xl font-semibold text-white">
            Managed Stores ({stores.length})
          </H2>
        </div>
        
        {stores.length === 0 ? (
          <div className="px-6 py-12 text-center text-white/60">
            <div className="text-4xl mb-4">🏪</div>
            <H3 className="text-lg font-medium text-white/80 mb-2">No stores added yet</H3>
            <P className="mt-0">Add a store above to start building your platform</P>
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
                      <Badge className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs border border-green-500/30">
                        Active
                      </Badge>
                    </div>
                    <div className="text-sm text-white/60 mb-4">
                      Added {new Date(store.addedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} • Last sync: {store.stats?.lastSync || 'Never'}
                      <br />
                      <span className="text-green-400 text-xs">
                        ✨ New Inbox Interface - Fast keyboard navigation & bulk approvals
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => window.open(`/feed?store=${store.username}`, '_blank')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
                    >
                      View Feed
                    </Button>
                    <Button
                      onClick={() => window.open(`/stores/${store.username}`, '_blank')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors font-medium"
                      title="Open new inbox-style review interface with keyboard shortcuts and bulk actions"
                    >
                      Review Audio Matches
                    </Button>
                    <Button
                      onClick={() => removeStore(store.id)}
                      className="text-red-400 hover:text-red-300 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Store Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <StatsCard
                    title="Collection #"
                    value={store.stats?.collectionCount || 0}
                    state={store.statsLoading ? 'loading' : store.statsError ? 'error' : 'value'}
                  />
                  <StatsCard
                    title="Views"
                    value={store.stats?.views || 0}
                    state={store.statsLoading ? 'loading' : store.statsError ? 'error' : (store.stats?.views === 0 ? 'empty' : 'value')}
                    emptyMessage="No views yet"
                  />
                  <StatsCard
                    title="Wishlists"
                    value={store.stats?.wishlists || 0}
                    state={store.statsLoading ? 'loading' : store.statsError ? 'error' : (store.stats?.wishlists === 0 ? 'empty' : 'value')}
                    emptyMessage="No wishlists yet"
                  />
                  <StatsCard
                    title="Sales"
                    value={store.stats?.sales || 0}
                    state={store.statsLoading ? 'loading' : store.statsError ? 'error' : (store.stats?.sales === 0 ? 'empty' : 'value')}
                    emptyMessage="No sales yet"
                  />
                  <StatsCard
                    title="Audio Match"
                    value={store.stats?.audioMatchPercentage ? `${store.stats.audioMatchPercentage}%` : '0%'}
                    state={store.statsLoading ? 'loading' : store.statsError ? 'error' : (store.stats?.audioMatchPercentage === 0 ? 'empty' : 'value')}
                    emptyMessage="Not processed"
                  />
                </div>

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
      </Card>
    </div>
  );
};