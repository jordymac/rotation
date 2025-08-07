import React from 'react';
import { cn } from '@/lib/utils';
import { PageLayout } from './PageLayout';

interface HomeTemplateProps {
  onEnterFeed: () => void;
  onBrowseStores: () => void;
}

export const HomeTemplate: React.FC<HomeTemplateProps> = ({
  onEnterFeed,
  onBrowseStores
}) => {
  return (
    <PageLayout showFooter={false}>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Rotation
            </h1>
            
            <nav className="flex items-center gap-4">
              <button 
                onClick={onBrowseStores}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Browse Stores
              </button>
              <button
                onClick={() => window.location.href = '/auth'}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </nav>
          </div>
        </header>
        
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center py-16 md:py-24">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6">
              Your Discogs store<br />looks like a spreadsheet.
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto">
              Rotation turns it into a swipeable, playable music feed your customers actually want to explore.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => window.location.href = '/auth'}
                className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Join the Beta
              </button>
              <button
                onClick={onEnterFeed}
                className="border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-900 hover:text-white transition-colors"
              >
                See It in Action
              </button>
            </div>
          </div>

          {/* Problem Section */}
          <div className="max-w-4xl mx-auto py-16 md:py-24">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
              Right now, your collection is hard to hear.
            </h2>
            <p className="text-2xl text-gray-600 mb-8 text-center">Discogs is built for collectors — not listeners.</p>
            
            <div className="space-y-6 mb-12">
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-lg text-gray-700">No audio previews</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-lg text-gray-700">Every listing looks the same</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-lg text-gray-700">Customers have to click, scroll, and guess</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-lg text-gray-700">YouTube embeds are chaotic and out of order</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xl text-gray-600 mb-2">It&apos;s not built for discovery. It&apos;s not built for music.</p>
            </div>
          </div>

          {/* What Rotation Gives You */}
          <div className="bg-gray-50 py-16 md:py-24 -mx-4">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
                A playable record wall. On mobile. In minutes.
              </h2>
              <p className="text-xl text-gray-600 text-center mb-8">
                Rotation pulls from your Discogs inventory, finds playable audio, and presents it in a visual, swipe-first feed.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="max-w-4xl mx-auto py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <span className="text-2xl">🎧</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Matched audio from YouTube or Apple Music
                  </h3>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-2xl">🖼</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Cover-forward layout — like browsing a wall of vinyl
                  </h3>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-2xl">📻</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Swipe between cuts, labels, sleeves, and genres
                  </h3>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-2xl">🛍</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Wishlist support + deep links to buy
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Built for Record Stores */}
          <div className="bg-gray-50 py-16 md:py-24 -mx-4">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 text-center">
                Built for record stores
              </h2>
              <p className="text-xl text-gray-600 text-center mb-12">Rotation makes it easy for stores to:</p>
              
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <p className="text-lg text-gray-700">Turn existing Discogs inventory into a playable experience</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <p className="text-lg text-gray-700">Share collections that sound as good as they look</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <p className="text-lg text-gray-700">Keep listeners digging longer, not bouncing after one click</p>
                </div>
              </div>
            </div>
          </div>

          {/* Under the Hood */}
          <div className="max-w-4xl mx-auto py-16 md:py-24">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
              What&apos;s under the hood
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Discogs OAuth integration
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Audio matching engine
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Next.js mobile UI
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Semantic tagging engine
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Wishlist & deep linking
                </h3>
              </div>
            </div>
          </div>

          {/* Coming Next */}
          <div className="bg-gray-50 py-16 md:py-24 -mx-4">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
                Coming next
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Verified previews
                  </h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Storefront CMS
                  </h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    &quot;For You&quot; personalization
                  </h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Analytics & optional pricing tools
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Why It Matters */}
          <div className="max-w-4xl mx-auto py-16 md:py-24">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Why it matters
            </h2>
            
            <div className="space-y-6 text-center">
              <p className="text-xl text-gray-600">Your records deserve to be heard — not buried.</p>
              <p className="text-xl text-gray-600">Give your customers a way to hear before they dig.</p>
              <p className="text-xl text-gray-600">Turn passive browsers into active listeners — and buyers.</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gray-50 py-16 md:py-24 -mx-4">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => window.location.href = '/auth'}
                  className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  Request Access
                </button>
                <a
                  href="https://github.com/jordymac/rotation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-900 hover:text-white transition-colors"
                >
                  Follow Progress
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};