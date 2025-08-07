import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, Input, Button, Badge, H3, P } from '@/components/atoms';
import { MagnifyingGlassIcon, EyeIcon } from '@/components/atoms';

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

interface StoreListProps {
  stores: Store[];
  onStoreSelect: (store: Store) => void;
  className?: string;
}

export const StoreList: React.FC<StoreListProps> = ({
  stores,
  onStoreSelect,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredStores = stores.filter(store => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      store.username.toLowerCase().includes(query) ||
      store.displayName?.toLowerCase().includes(query) ||
      store.location?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={cn('', className)}>
      {/* Search and View Controls */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? '' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? '' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
          >
            List
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-white/60 text-sm mb-4">
        {filteredStores.length} store{filteredStores.length !== 1 ? 's' : ''} found
      </div>

      {/* Store Grid/List */}
      <div className={cn(
        'gap-4',
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'space-y-4'
      )}>
        {filteredStores.map((store) => (
          <Card
            key={store.id}
            className={cn(
              'bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer',
              viewMode === 'list' ? 'p-4' : 'p-6'
            )}
            onClick={() => onStoreSelect(store)}
          >
            {viewMode === 'grid' ? (
              // Grid View
              <div className="text-center">
                {store.avatar_url ? (
                  <img
                    src={store.avatar_url}
                    alt={store.displayName || store.username}
                    className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">
                      {(store.displayName || store.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <H3 className="text-white text-lg mb-2">
                  {store.displayName || store.username}
                </H3>
                
                {store.location && (
                  <P className="text-white/70 text-sm mb-3 mt-0">
                    📍 {store.location}
                  </P>
                )}
                
                <div className="flex justify-center gap-2 mb-3">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                    {store.inventory_count.toLocaleString()} items
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200">
                    ⭐ {store.rating.toFixed(1)}
                  </Badge>
                </div>
                
                {store.description && (
                  <P className="text-white/60 text-xs line-clamp-2 mt-0">
                    {store.description}
                  </P>
                )}
              </div>
            ) : (
              // List View
              <div className="flex gap-4">
                {store.avatar_url ? (
                  <img
                    src={store.avatar_url}
                    alt={store.displayName || store.username}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">
                      {(store.displayName || store.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <H3 className="text-white text-base mb-1">
                        {store.displayName || store.username}
                      </H3>
                      {store.location && (
                        <P className="text-white/70 text-sm mt-0">
                          📍 {store.location}
                        </P>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 text-xs">
                      {store.inventory_count.toLocaleString()} items
                    </Badge>
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200 text-xs">
                      ⭐ {store.rating.toFixed(1)}
                    </Badge>
                  </div>
                  
                  {store.description && (
                    <P className="text-white/60 text-sm line-clamp-1 mt-0">
                      {store.description}
                    </P>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredStores.length === 0 && (
        <div className="text-center py-12">
          <P className="text-white/60 mt-0">
            No stores found matching your search.
          </P>
        </div>
      )}
    </div>
  );
};