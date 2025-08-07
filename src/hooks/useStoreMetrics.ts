import { useState, useEffect } from 'react';
import { getStoreMetrics } from '@/lib/analytics';

interface StoreMetrics {
  collectionCount: number;
  views: number;
  wishlists: number;
  sales: number;
  audioMatchPercentage: number;
  lastSync?: string;
}

interface UseStoreMetricsResult {
  metrics: StoreMetrics | null;
  loading: boolean;
  error: boolean;
  refetch: () => Promise<void>;
}

export const useStoreMetrics = (storeUsername: string): UseStoreMetricsResult => {
  const [metrics, setMetrics] = useState<StoreMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMetrics = async () => {
    if (!storeUsername) return;
    
    try {
      setLoading(true);
      setError(false);
      const data = await getStoreMetrics(storeUsername);
      setMetrics(data);
    } catch (err) {
      console.error(`Error fetching metrics for ${storeUsername}:`, err);
      setError(true);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [storeUsername]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics
  };
};

// Hook for multiple stores
export const useMultipleStoreMetrics = (storeUsernames: string[]) => {
  const [storeMetrics, setStoreMetrics] = useState<Record<string, StoreMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const fetchAllMetrics = async () => {
    if (storeUsernames.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const results = await Promise.allSettled(
        storeUsernames.map(async (username) => {
          const data = await getStoreMetrics(username);
          return { username, data };
        })
      );

      const newMetrics: Record<string, StoreMetrics> = {};
      const newErrors: Record<string, boolean> = {};

      results.forEach((result, index) => {
        const username = storeUsernames[index];
        if (result.status === 'fulfilled') {
          newMetrics[username] = result.value.data;
          newErrors[username] = false;
        } else {
          newErrors[username] = true;
        }
      });

      setStoreMetrics(newMetrics);
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMetrics();
  }, [storeUsernames.join(',')]);

  return {
    storeMetrics,
    loading,
    errors,
    refetch: fetchAllMetrics
  };
};