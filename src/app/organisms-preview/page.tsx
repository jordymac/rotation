'use client';

import React, { useState } from 'react';
import { DiscogsRelease } from '@/utils/discogs';
import { Button, H1, H2, Card } from '@/components/atoms';
import { 
  FeedGrid, 
  FeedFilterBar, 
  Footer, 
  StoreList, 
  RecordTable, 
  AudioMatchingPanel 
} from '@/components/organisms';

// Mock data for previewing organisms
const mockReleases: DiscogsRelease[] = [
  {
    id: 1,
    title: "Random Access Memories",
    artist: "Daft Punk",
    label: "Columbia",
    year: 2013,
    genre: "Electronic",
    format: "LP",
    condition: "Mint (M)",
    price: "USD 29.99",
    thumb: "https://i.discogs.com/example1.jpg",
    cover_image: "https://i.discogs.com/example1-large.jpg",
    uri: "/release/4721461",
    resource_url: "https://api.discogs.com/releases/4721461",
    tracks: [
      { position: "A1", title: "Give Life Back to Music", duration: "4:34" },
      { position: "A2", title: "The Game of Love", duration: "5:22" }
    ]
  },
  {
    id: 2,
    title: "Discovery",
    artist: "Daft Punk",
    label: "Virgin",
    year: 2001,
    genre: "Electronic",
    format: "2x12\"",
    condition: "Very Good Plus (VG+)",
    price: "USD 24.99",
    thumb: "https://i.discogs.com/example2.jpg",
    cover_image: "https://i.discogs.com/example2-large.jpg",
    uri: "/release/47813",
    resource_url: "https://api.discogs.com/releases/47813",
    tracks: [
      { position: "A1", title: "One More Time", duration: "5:20" },
      { position: "A2", title: "Aerodynamic", duration: "3:27" }
    ]
  }
];

const mockStores = [
  {
    id: "1",
    username: "record_paradise",
    displayName: "Record Paradise",
    location: "Los Angeles, CA",
    inventory_count: 15420,
    rating: 4.8,
    description: "Premium vinyl records from the golden age of music",
    avatar_url: ""
  },
  {
    id: "2",
    username: "vinyl_vault",
    displayName: "The Vinyl Vault",
    location: "New York, NY",
    inventory_count: 8932,
    rating: 4.6,
    description: "Rare finds and classic albums for serious collectors"
  }
];

const mockTrackMatches = [
  {
    trackIndex: 0,
    trackTitle: "Give Life Back to Music",
    trackPosition: "A1",
    candidates: [
      {
        platform: 'youtube' as const,
        id: "abc123",
        title: "Give Life Back to Music",
        artist: "Daft Punk",
        duration: 274,
        url: "https://youtube.com/watch?v=abc123",
        confidence: 95,
        classification: 'high' as const,
        source: 'discogs_embedded' as const
      }
    ],
    bestMatch: {
      platform: 'youtube' as const,
      id: "abc123",
      title: "Give Life Back to Music",
      artist: "Daft Punk",
      duration: 274,
      url: "https://youtube.com/watch?v=abc123",
      confidence: 95,
      classification: 'high' as const,
      source: 'discogs_embedded' as const
    },
    approved: false
  }
];

export default function OrganismsPreview() {
  const [selectedComponent, setSelectedComponent] = useState<string>('FeedFilterBar');
  const [filters, setFilters] = useState({
    searchQuery: '',
    minPrice: '',
    maxPrice: '',
    format: '',
    condition: '',
    genre: '',
    year: ''
  });

  const renderSelectedComponent = () => {
    switch (selectedComponent) {
      case 'FeedFilterBar':
        return (
          <FeedFilterBar
            searchQuery={filters.searchQuery}
            onSearchChange={(query) => setFilters({...filters, searchQuery: query})}
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={() => setFilters({
              searchQuery: '',
              minPrice: '',
              maxPrice: '',
              format: '',
              condition: '',
              genre: '',
              year: ''
            })}
            showFilters={true}
            onToggleFilters={() => {}}
            resultsCount={mockReleases.length}
            storeInfo={{ id: "1", username: "record_paradise" }}
          />
        );

      case 'Footer':
        return <Footer />;

      case 'StoreList':
        return (
          <StoreList
            stores={mockStores}
            onStoreSelect={(store) => console.log('Selected store:', store)}
          />
        );

      case 'RecordTable':
        return (
          <RecordTable
            releases={mockReleases}
            isSellerMode={true}
            onManageItem={(release) => console.log('Manage:', release)}
            onVerifyAudio={(release) => console.log('Verify audio:', release)}
          />
        );

      case 'AudioMatchingPanel':
        return (
          <AudioMatchingPanel
            release={mockReleases[0]}
            matches={mockTrackMatches}
            onApproveMatch={(trackIndex, candidateId) => console.log('Approve:', trackIndex, candidateId)}
            onRejectMatch={(trackIndex, candidateId) => console.log('Reject:', trackIndex, candidateId)}
            onPlayPreview={(url) => console.log('Play:', url)}
          />
        );

      default:
        return <div className="text-white">Select a component to preview</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <H1 className="text-white mb-8">Organisms Preview</H1>
        
        {/* Component Selector */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 mb-8">
          <H2 className="text-white mb-4">Select Component</H2>
          <div className="flex flex-wrap gap-2">
            {[
              'FeedFilterBar',
              'Footer', 
              'StoreList',
              'RecordTable',
              'AudioMatchingPanel'
            ].map((component) => (
              <Button
                key={component}
                variant={selectedComponent === component ? 'default' : 'outline'}
                onClick={() => setSelectedComponent(component)}
                className={selectedComponent === component ? '' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
              >
                {component}
              </Button>
            ))}
          </div>
        </Card>

        {/* Component Preview */}
        <div className="min-h-96">
          {renderSelectedComponent()}
        </div>
      </div>
    </div>
  );
}