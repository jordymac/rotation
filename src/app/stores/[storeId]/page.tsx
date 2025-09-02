'use client';

import { Suspense, use } from 'react';
import { AdminTrackReviewTemplate } from '@/components/templates/AdminTrackReviewTemplate';

interface StoreReviewPageProps {
  params: Promise<{ storeId: string }>;
}

function StoreReviewContent({ storeId }: { storeId: string }) {
  // Pass store filter to the track review template
  return (
    <AdminTrackReviewTemplate 
      defaultFilters={{ 
        status: 'all',
        store: storeId
      }}
      storeFocused={true}
      pageTitle={`Track Review: ${storeId}`}
    />
  );
}

export default function StoreReviewPage({ params }: StoreReviewPageProps) {
  const resolvedParams = use(params);
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-white mb-4">Loading track review...</h1>
          <p className="text-white/60 text-sm">Preparing inbox interface...</p>
        </div>
      </div>
    }>
      <StoreReviewContent storeId={resolvedParams.storeId} />
    </Suspense>
  );
}