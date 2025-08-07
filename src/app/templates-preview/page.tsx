'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { DiscogsRelease } from '@/utils/discogs';
import { Button, H1, H2, Card } from '@/components/atoms';
import { 
  HomeTemplate,
  StoresTemplate,
  AdminTemplate,
  ErrorTemplate,
  LoadingTemplate
} from '@/components/templates';

// Mock data for template previews
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

export default function TemplatesPreview() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('HomeTemplate');

  const renderSelectedTemplate = () => {
    switch (selectedTemplate) {
      case 'HomeTemplate':
        return (
          <HomeTemplate
            onEnterFeed={() => console.log('Enter feed')}
            onBrowseStores={() => console.log('Browse stores')}
          />
        );

      case 'StoresTemplate':
        return (
          <StoresTemplate
            stores={mockStores}
            onStoreSelect={(store) => console.log('Selected store:', store)}
            isLoading={false}
          />
        );

      case 'AdminTemplate':
        return (
          <AdminTemplate
            releases={mockReleases}
            onManageItem={(release) => console.log('Manage:', release)}
            onVerifyAudio={(release) => console.log('Verify audio:', release)}
            activeTab="records"
            onTabChange={(tab) => console.log('Tab changed:', tab)}
          />
        );

      case 'ErrorTemplate':
        return (
          <ErrorTemplate
            title="Page Not Found"
            message="The page you're looking for doesn't exist or has been moved."
            statusCode={404}
            onRetry={() => console.log('Retry')}
            onGoHome={() => console.log('Go home')}
          />
        );

      case 'LoadingTemplate':
        return (
          <LoadingTemplate
            message="Loading Records..."
            subtitle="Fetching the latest vinyl releases from Discogs"
            showSpinner={true}
          />
        );

      default:
        return <div className="text-white">Select a template to preview</div>;
    }
  };

  // If we're showing a template, render it full-screen
  if (selectedTemplate !== 'selector') {
    return (
      <div className="relative">
        {/* Template Preview */}
        <div className="min-h-screen">
          {renderSelectedTemplate()}
        </div>
        
        {/* Template Selector Overlay */}
        <div className="fixed top-4 right-4 z-50">
          <Card className="bg-black/90 backdrop-blur-sm border-white/20 p-4">
            <H2 className="text-white text-sm mb-3">Template Preview</H2>
            <div className="flex flex-col gap-2">
              {[
                'HomeTemplate',
                'StoresTemplate', 
                'AdminTemplate',
                'ErrorTemplate',
                'LoadingTemplate'
              ].map((template) => (
                <Button
                  key={template}
                  variant={selectedTemplate === template ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTemplate(template)}
                  className={cn(
                    'justify-start text-xs',
                    selectedTemplate === template 
                      ? '' 
                      : 'text-white hover:bg-white/20'
                  )}
                >
                  {template}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Default selector view (shouldn't reach here with current logic)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <H1 className="text-white mb-8">Templates Preview</H1>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 mb-8">
          <H2 className="text-white mb-4">Select Template</H2>
          <div className="flex flex-wrap gap-2">
            {[
              'HomeTemplate',
              'StoresTemplate',
              'AdminTemplate', 
              'ErrorTemplate',
              'LoadingTemplate'
            ].map((template) => (
              <Button
                key={template}
                variant="outline"
                onClick={() => setSelectedTemplate(template)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {template}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}