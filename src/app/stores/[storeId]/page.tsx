'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import RecordCard from '@/components/RecordCard';
import { DiscogsRelease } from '@/utils/discogs';

interface Store {
  id: string;
  username: string;
}

interface StoreInventoryResponse {
  results: DiscogsRelease[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
  };
  store: Store;
}

export default function StorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  
  // Always in seller mode for management interface
  const isSellerMode = true;
  
  const [storeData, setStoreData] = useState<StoreInventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    format: '',
    condition: '',
    genre: '',
    year: '',
    // Seller-specific filters
    status: '', // active, inactive, sold, draft
    verification: '', // verified, needs_review, unverified
    performance: '' // high_views, low_views, recent_inquiries
  });
  // Always use list view for seller management
  const viewMode = 'list';
  const [showFilters, setShowFilters] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    loadStoreInventory();
  }, [storeId]);

  const handleManageItem = (release: DiscogsRelease) => {
    // For now, show detailed info - will implement modal later
    const details = [
      `Title: ${release.title}`,
      `Artist: ${release.artist}`,
      `Label: ${release.label}`,
      `Year: ${release.year}`,
      `Condition: ${release.condition || 'N/A'}`,
      `Price: ${release.price || 'N/A'}`,
      `Status: Active`,
      `Verification: ✅ Verified`
    ].join('\n');
    
    alert(`Item Management\n\n${details}\n\nActions:\n- Edit details\n- Update price\n- Change status\n- View analytics`);
  };

  const loadStoreInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/stores/${storeId}/inventory`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Store not found');
        } else {
          throw new Error(`API error: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      setStoreData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load store inventory');
    } finally {
      setLoading(false);
    }
  };

  const filteredReleases = storeData?.results.filter(release => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        release.title.toLowerCase().includes(query) ||
        release.artist.toLowerCase().includes(query) ||
        release.label.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Price filter
    if (filters.minPrice || filters.maxPrice) {
      const price = release.price ? parseFloat(release.price.split(' ')[1]) : 0;
      if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;
    }

    // Format filter
    if (filters.format && !release.genre.some(g => g.toLowerCase().includes(filters.format.toLowerCase()))) {
      return false;
    }

    // Condition filter
    if (filters.condition && release.condition && !release.condition.toLowerCase().includes(filters.condition.toLowerCase())) {
      return false;
    }

    // Year filter
    if (filters.year && release.year.toString() !== filters.year) {
      return false;
    }

    return true;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Store Not Found</h1>
          <p className="text-red-600 mb-8">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Store Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {storeData?.store.username} - Store Management
              </h1>
              <p className="text-gray-600 mb-4">
                Managing {storeData?.pagination.items} inventory items
              </p>
              <div className="flex gap-4">
                <a
                  href={`/feed?store=${storeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  📱 View Public Feed
                </a>
                <a
                  href={`https://www.discogs.com/user/${storeData?.store.username}/inventory`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View on Discogs →
                </a>
              </div>
            </div>
          </div>

          {/* Seller Dashboard Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{storeData?.pagination.items || 0}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-500">Needs Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-500">Recent Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-500">This Month Sales</div>
            </div>
          </div>
        </div>

        {/* Search and Filters Accordion */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          {/* Accordion Header */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Search & Filters</h2>
              {(searchQuery || Object.values(filters).some(filter => filter !== '')) && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  Active
                </span>
              )}
            </div>
            <div className={`transform transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Accordion Content */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <input
                    type="text"
                    placeholder="Search by artist, title, or label..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Price Range */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min $"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max $"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Format */}
                <select
                  value={filters.format}
                  onChange={(e) => setFilters({...filters, format: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Formats</option>
                  <option value="vinyl">Vinyl</option>
                  <option value="cd">CD</option>
                  <option value="cassette">Cassette</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Condition */}
                <select
                  value={filters.condition}
                  onChange={(e) => setFilters({...filters, condition: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Conditions</option>
                  <option value="mint">Mint (M)</option>
                  <option value="near mint">Near Mint (NM)</option>
                  <option value="very good plus">Very Good Plus (VG+)</option>
                  <option value="very good">Very Good (VG)</option>
                </select>

                {/* Year */}
                <input
                  type="number"
                  placeholder="Year"
                  value={filters.year}
                  onChange={(e) => setFilters({...filters, year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      minPrice: '',
                      maxPrice: '',
                      format: '',
                      condition: '',
                      genre: '',
                      year: '',
                      status: '',
                      verification: '',
                      performance: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>

              {/* Management Filters */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Management Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="sold">Sold</option>
                    <option value="draft">Draft</option>
                  </select>

                  {/* Verification Filter */}
                  <select
                    value={filters.verification}
                    onChange={(e) => setFilters({...filters, verification: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Verification</option>
                    <option value="verified">✅ Verified</option>
                    <option value="needs_review">⚠️ Needs Review</option>
                    <option value="unverified">❌ Unverified</option>
                  </select>

                  {/* Performance Filter */}
                  <select
                    value={filters.performance}
                    onChange={(e) => setFilters({...filters, performance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Performance</option>
                    <option value="high_views">🔥 High Views</option>
                    <option value="recent_inquiries">💬 Recent Inquiries</option>
                    <option value="low_activity">📉 Low Activity</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Queue Accordion */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          {/* Accordion Header */}
          <button
            onClick={() => setShowVerification(!showVerification)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Verification Queue</h2>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                3 items need review
              </span>
            </div>
            <div className={`transform transition-transform duration-200 ${showVerification ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Accordion Content */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showVerification ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="px-6 pb-6">
              <div className="space-y-3">
                {/* Mock verification items */}
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-600">⚠️</span>
                    <div>
                      <div className="font-medium text-gray-900">Michael Jackson - Thriller</div>
                      <div className="text-sm text-gray-500">Metadata mismatch: Year (1982 vs 1983)</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                      Approve
                    </button>
                    <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                      Review
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-red-600">❌</span>
                    <div>
                      <div className="font-medium text-gray-900">Pink Floyd - Dark Side of the Moon</div>
                      <div className="text-sm text-gray-500">Image quality too low for verification</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                      Re-scan
                    </button>
                    <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                      Manual Review
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600">✅</span>
                    <div>
                      <div className="font-medium text-gray-900">Annihilator - Never, Neverland</div>
                      <div className="text-sm text-gray-500">Successfully verified and matched</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  View All Verification History →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Bulk Actions:</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                    Update Prices
                  </button>
                  <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                    Mark as Active
                  </button>
                  <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                    Mark as Inactive
                  </button>
                  <button className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors">
                    Request Verification
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                0 items selected
              </div>
            </div>
          </div>

        {/* Results */}
        <div className="mb-4 text-gray-600">
          Showing {filteredReleases.length} of {storeData?.pagination.items} items
          <span className="ml-4 text-blue-600">
            • {Math.floor(filteredReleases.length * 0.8)} active • {Math.ceil(filteredReleases.length * 0.15)} need review • {Math.ceil(filteredReleases.length * 0.05)} inactive
          </span>
        </div>

        {/* Inventory List */}
        {filteredReleases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No items match your search criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  minPrice: '',
                  maxPrice: '',
                  format: '',
                  condition: '',
                  genre: '',
                  year: '',
                  status: '',
                  verification: '',
                  performance: ''
                });
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReleases.map((release) => (
              <RecordCard 
                key={release.id} 
                release={release} 
                viewMode={viewMode}
                isSellerMode={isSellerMode}
                onManageItem={handleManageItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}