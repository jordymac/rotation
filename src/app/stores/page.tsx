'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

interface Store {
  id: string;
  username: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  releaseCount: number;
  audioCoverage: number;
  genres: string[];
  location?: string;
  followers: number;
  isFollowing?: boolean;
  lastSync?: string;
}

// Mock data for development - will be replaced with real API
const mockStores: Store[] = [
  {
    id: 'fanatico_records',
    username: 'fanatico_records',
    displayName: 'Fanatico Records',
    description: 'Curated vinyl selection from electronic, jazz, and world music',
    releaseCount: 2847,
    audioCoverage: 78,
    genres: ['Electronic', 'Jazz', 'World Music', 'Ambient'],
    location: 'Melbourne, AU',
    followers: 1240,
    isFollowing: false,
    lastSync: '2 hours ago'
  },
  {
    id: 'rough_trade',
    username: 'rough_trade',
    displayName: 'Rough Trade',
    description: 'Independent music store with focus on alternative and indie',
    releaseCount: 15420,
    audioCoverage: 65,
    genres: ['Indie', 'Alternative', 'Rock', 'Electronic'],
    location: 'London, UK',
    followers: 8950,
    isFollowing: true,
    lastSync: '1 hour ago'
  },
  {
    id: 'amoeba_music',
    username: 'amoeba_music',
    displayName: 'Amoeba Music',
    description: 'California-based record store chain with massive selection',
    releaseCount: 45000,
    audioCoverage: 45,
    genres: ['Rock', 'Hip Hop', 'Jazz', 'Classical', 'Electronic'],
    location: 'Berkeley, CA',
    followers: 12300,
    isFollowing: false,
    lastSync: '30 minutes ago'
  },
  {
    id: 'sounds_of_the_universe',
    username: 'sounds_of_the_universe',
    displayName: 'Sounds of the Universe',
    description: 'Rare groove, soul, funk, and world music specialists',
    releaseCount: 3200,
    audioCoverage: 82,
    genres: ['Soul', 'Funk', 'World Music', 'Rare Groove'],
    location: 'London, UK',
    followers: 2150,
    isFollowing: true,
    lastSync: '4 hours ago'
  },
  {
    id: 'disc_union',
    username: 'disc_union',
    displayName: 'Disc Union',
    description: 'Japanese record store specializing in jazz and experimental music',
    releaseCount: 8900,
    audioCoverage: 71,
    genres: ['Jazz', 'Experimental', 'Ambient', 'Classical'],
    location: 'Tokyo, JP',
    followers: 3400,
    isFollowing: false,
    lastSync: '6 hours ago'
  }
];

function StoreCard({ store }: { store: Store }) {
  const [isFollowing, setIsFollowing] = useState(store.isFollowing || false);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    // TODO: Implement actual follow/unfollow API call
  };

  const handleStoreClick = () => {
    window.location.href = `/feed?store=${store.id}`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-200 border border-white/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            {store.avatar ? (
              <img src={store.avatar} alt={store.displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <BuildingStorefrontIcon className="w-8 h-8 text-white/70" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{store.displayName || store.username}</h3>
            <p className="text-white/70">@{store.username}</p>
            {store.location && (
              <p className="text-white/50 text-sm">{store.location}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleFollowToggle}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isFollowing 
              ? 'bg-white/20 text-white hover:bg-white/30' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {store.description && (
        <p className="text-white/80 mb-4 text-sm">{store.description}</p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{store.releaseCount.toLocaleString()}</div>
          <div className="text-white/70 text-sm">Releases</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{store.audioCoverage}%</div>
          <div className="text-white/70 text-sm">Audio Coverage</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {store.genres.slice(0, 4).map((genre) => (
          <span key={genre} className="px-2 py-1 bg-white/20 rounded text-white/80 text-xs">
            {genre}
          </span>
        ))}
        {store.genres.length > 4 && (
          <span className="px-2 py-1 bg-white/20 rounded text-white/80 text-xs">
            +{store.genres.length - 4} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-white/60 text-sm">
          {store.followers.toLocaleString()} followers • Synced {store.lastSync}
        </div>
        <button
          onClick={handleStoreClick}
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Visit Store
        </button>
      </div>
    </div>
  );
}

function StoresContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [releaseCountFilter, setReleaseCountFilter] = useState('');
  const [stores, setStores] = useState<Store[]>(mockStores);
  const [filteredStores, setFilteredStores] = useState<Store[]>(mockStores);

  // Get all unique genres from stores
  const allGenres = Array.from(new Set(stores.flatMap(store => store.genres))).sort();

  // Filter stores based on search and filters
  useEffect(() => {
    let filtered = stores;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(store => 
        store.username.toLowerCase().includes(query) ||
        (store.displayName && store.displayName.toLowerCase().includes(query)) ||
        (store.description && store.description.toLowerCase().includes(query))
      );
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(store =>
        selectedGenres.some(genre => store.genres.includes(genre))
      );
    }

    // Release count filter
    if (releaseCountFilter) {
      filtered = filtered.filter(store => {
        switch (releaseCountFilter) {
          case '>500': return store.releaseCount > 500;
          case '>1000': return store.releaseCount > 1000;
          case '>5000': return store.releaseCount > 5000;
          case '>10000': return store.releaseCount > 10000;
          default: return true;
        }
      });
    }

    setFilteredStores(filtered);
  }, [searchQuery, selectedGenres, releaseCountFilter, stores]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/20 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">All Stores</h1>
              <p className="text-white/70 mt-1">Discover record stores from around the world</p>
            </div>
            <button
              onClick={() => window.location.href = '/feed'}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← Back to Feed
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Search stores by name, handle, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Genre Filter */}
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-white/80 mb-2">Genres</label>
              <div className="flex flex-wrap gap-2">
                {allGenres.slice(0, 8).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      selectedGenres.includes(genre)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Release Count Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Release Count</label>
              <select
                value={releaseCountFilter}
                onChange={(e) => setReleaseCountFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/40"
              >
                <option value="">Any amount</option>
                <option value=">500">&gt; 500 releases</option>
                <option value=">1000">&gt; 1,000 releases</option>
                <option value=">5000">&gt; 5,000 releases</option>
                <option value=">10000">&gt; 10,000 releases</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Store Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 text-white/70">
          {filteredStores.length} store{filteredStores.length !== 1 ? 's' : ''} found
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <BuildingStorefrontIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white/70 mb-2">No stores found</h3>
            <p className="text-white/50">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoresPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-lg">Loading stores...</p>
        </div>
      </div>
    }>
      <StoresContent />
    </Suspense>
  );
}