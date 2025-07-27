'use client';

// import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface Store {
  id: string;
  username: string;
  addedAt: string;
}

export default function AdminPage() {
  // const { user } = useUser();
  const user = null; // Temporarily disabled
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
        setStores(data.stores || []);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Store Administration
          </h1>
          
          {/* Add Store Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Store
            </h2>
            
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={newStoreUsername}
                onChange={(e) => setNewStoreUsername(e.target.value)}
                placeholder="Enter Discogs store username"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addStore()}
              />
              <button
                onClick={addStore}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Adding...' : 'Add Store'}
              </button>
            </div>
            
            {error && (
              <div className="text-red-600 text-sm mb-4">
                {error}
              </div>
            )}
            
            <p className="text-sm text-gray-500">
              Enter the Discogs username of a store with marketplace inventory.
            </p>
          </div>

          {/* Stores List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Managed Stores ({stores.length})
              </h2>
            </div>
            
            {stores.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No stores added yet. Add a store above to get started.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {stores.map((store) => (
                  <div key={store.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {store.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        Added {new Date(store.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/stores/${store.id}`, '_blank')}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Manage Storefront
                      </button>
                      <button
                        onClick={() => window.open(`/feed?store=${store.id}`, '_blank')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Public Feed
                      </button>
                      <button
                        onClick={() => window.open(`https://www.discogs.com/user/${store.username}/inventory`, '_blank')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View on Discogs
                      </button>
                      <button
                        onClick={() => removeStore(store.id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-4"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}