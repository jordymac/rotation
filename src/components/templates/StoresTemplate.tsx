import React from 'react';
import { cn } from '@/lib/utils';
import { H1, P, Button } from '@/components/atoms';
import { StoreList } from '@/components/organisms';
import { PageLayout } from './PageLayout';

interface Store {
  id: string;
  username: string;
  displayName?: string;
  location?: string;
  inventory_count: number;
  rating: number;
  description?: string;
  avatar_url?: string;
}

interface StoresTemplateProps {
  stores: Store[];
  onStoreSelect: (store: Store) => void;
  isLoading?: boolean;
  className?: string;
}

export const StoresTemplate: React.FC<StoresTemplateProps> = ({
  stores,
  onStoreSelect,
  isLoading = false,
  className
}) => {
  return (
    <PageLayout className={className}>
      <div className="min-h-screen bg-black text-white">
        {/* Sticky Header - Title and Back Button Only */}
        <div className="border-b border-white/20 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <H1 className="text-3xl font-bold">All Stores</H1>
                <P className="text-white/70 mt-1">Discover record stores from around the world</P>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  Home
                </Button>
                <Button
                  onClick={() => window.location.href = '/feed'}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  Feed
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
              <P className="text-white/60 mt-0">Loading stores...</P>
            </div>
          ) : (
            /* Store List */
            <StoreList
              stores={stores}
              onStoreSelect={onStoreSelect}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};