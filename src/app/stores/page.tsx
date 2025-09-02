'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StoresTemplate, LoadingTemplate } from '@/components/templates';

interface Store {
  id: string;
  username: string;
  displayName: string;
  description?: string;
  avatar_url?: string;
  inventory_count: number;
  rating: string;
  location: string;
  html_url: string;
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
      // Use lightweight store directory endpoint - no inventory data loaded
      const response = await fetch('/api/storefront/directory');
      if (response.ok) {
        const data = await response.json();
        console.log(`[Stores Page] Loaded ${data.stores?.length || 0} stores from directory`);
        setStores(data.stores || []);
      } else {
        console.error('Failed to load store directory:', response.status);
        setStores([]);
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
      setStores([]);
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

  const handleStoreSelect = (store: Store) => {
    // Navigate directly to store feed - no pre-loading of inventory data
    // The feed page will handle loading the first record when it mounts
    console.log(`[Stores Page] Navigating to store: ${store.id}`);
    router.push(`/feed?store=${store.id}`);
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