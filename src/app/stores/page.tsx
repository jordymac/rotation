'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StoresTemplate, LoadingTemplate } from '@/components/templates';

interface Store {
  id: string;
  username: string;
  displayName?: string;
  description?: string;
  avatar_url?: string;
  inventory_count: number;
  rating: number;
  location?: string;
}

// Real stores data will be fetched from API

function StoresContent() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load real stores from admin API
    loadRealStores();
  }, []);

  const loadRealStores = async () => {
    try {
      const response = await fetch('/api/admin/stores');
      if (response.ok) {
        const data = await response.json();
        
        // Fetch inventory counts for each store
        const storesWithInventory = await Promise.all(
          (data.stores || []).map(async (store: any) => {
            let inventoryCount = 0;
            try {
              const inventoryResponse = await fetch(`/api/stores/${store.username}/inventory`);
              if (inventoryResponse.ok) {
                const inventoryData = await inventoryResponse.json();
                inventoryCount = inventoryData.pagination?.items || inventoryData.results?.length || 0;
              }
            } catch (error) {
              console.error(`Failed to fetch inventory for ${store.username}:`, error);
            }
            
            return {
              id: store.username, // Use username as ID
              username: store.username,
              displayName: store.username.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              description: `Record store with curated vinyl selection`,
              inventory_count: inventoryCount,
              rating: 4.5, // Default rating
              location: 'Worldwide'
            };
          })
        );
        
        setStores(storesWithInventory);
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
      setStores([]); // Empty array instead of mock data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Loading timeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleStoreSelect = async (store: Store) => {
    try {
      // Get store's first listing to ensure we have a specific record to show
      const inventoryResponse = await fetch(`/api/stores/${store.id}/inventory`);
      
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        
        if (inventoryData.results?.[0]) {
          const firstListing = inventoryData.results[0];
          // For now, use the record ID as listing ID (until you implement actual listing IDs)
          const listingId = firstListing.id || firstListing.listingId;
          router.push(`/feed?store=${store.id}&record=${listingId}`);
        } else {
          // Store has no inventory - redirect to store profile instead of empty feed
          console.warn(`Store ${store.id} has no inventory`);
          router.push(`/stores/${store.id}`); // This would need a store profile page
        }
      } else {
        console.error(`Failed to fetch inventory for store ${store.id}`);
        // Fallback to store profile
        router.push(`/stores/${store.id}`);
      }
    } catch (error) {
      console.error(`Error loading store ${store.id}:`, error);
      // Fallback to store profile
      router.push(`/stores/${store.id}`);
    }
  };

  return (
    <StoresTemplate
      stores={stores}
      onStoreSelect={handleStoreSelect}
      isLoading={isLoading}
    />
  );
}

export default function StoresPage() {
  return (
    <Suspense fallback={<LoadingTemplate message="Loading stores..." />}>
      <StoresContent />
    </Suspense>
  );
}