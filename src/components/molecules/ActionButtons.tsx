import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms';
import { 
  EyeIcon, 
  MusicalNoteIcon,
  ShoppingCartIcon 
} from '@/components/atoms';
import { DiscogsRelease } from '@/utils/discogs';

interface ActionButtonsProps {
  release: DiscogsRelease;
  isSellerMode?: boolean;
  onVerifyAudio?: (release: DiscogsRelease) => void;
  layout?: 'horizontal' | 'vertical';
  trackMatches?: Array<{
    trackIndex: number;
    approved?: boolean;
    candidates?: Array<{ confidence: number; }>;
  }>;
  className?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  release,
  isSellerMode = false,
  onVerifyAudio,
  layout = 'horizontal',
  trackMatches,
  className
}) => {
  if (isSellerMode) {
    // Determine if manual verification is needed
    const needsManualVerification = trackMatches && trackMatches.length > 0 
      ? trackMatches.some(match => {
          // Needs verification if:
          // - No candidates found, OR
          // - Best candidate has low confidence (< 80%), OR
          // - Track is not approved
          const hasLowConfidence = match.candidates && match.candidates.length > 0 
            ? Math.max(...match.candidates.map(c => c.confidence)) < 80
            : true;
          return !match.approved || hasLowConfidence || !match.candidates || match.candidates.length === 0;
        })
      : true; // Default to needing verification if no track matches loaded yet

    // Show different states based on track match status
    let buttonText = 'Verify Audio';
    let buttonColor = 'text-blue-400 hover:text-blue-300';
    
    // Handle loading state when trackMatches is undefined (background processing)
    if (trackMatches === undefined) {
      buttonText = 'Checking Audio...';
      buttonColor = 'text-yellow-400 hover:text-yellow-300';
    } else if (trackMatches && trackMatches.length > 0) {
      const allApproved = trackMatches.every(match => match.approved);
      const hasHighConfidenceMatches = trackMatches.some(match => 
        match.candidates && match.candidates.length > 0 && 
        Math.max(...match.candidates.map(c => c.confidence)) >= 80
      );
      
      if (allApproved && hasHighConfidenceMatches) {
        buttonText = 'Audio Verified ✓';
        buttonColor = 'text-green-400 hover:text-green-300';
      } else if (needsManualVerification) {
        buttonText = 'Review Audio';
        buttonColor = 'text-orange-400 hover:text-orange-300';
      }
    } else if (trackMatches && trackMatches.length === 0) {
      // Empty array means processing complete but no matches found
      buttonText = 'No Audio Available';
      buttonColor = 'text-gray-400 hover:text-gray-300';
    }

    return (
      <div className={cn(
        'border-l-2 border-white/20 pl-6 pr-4 py-3 space-y-2',
        className
      )}>
        <Button
          variant="ghost"
          onClick={() => onVerifyAudio?.(release)}
          className={`w-full flex items-center justify-center ${buttonColor} transition-colors text-sm font-medium py-1`}
        >
          <MusicalNoteIcon className="w-4 h-4 mr-1" />
          <span>{buttonText}</span>
        </Button>
        
        <Button
          asChild
          variant="ghost"
          className="w-full flex items-center justify-center text-white/60 hover:text-white/80 transition-colors text-xs py-1"
        >
          <a
            href={release.uri.startsWith('http') ? release.uri : `https://www.discogs.com${release.uri}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Discogs
          </a>
        </Button>
      </div>
    );
  }

  // Consumer/listener mode
  return (
    <div className={cn(
      'w-full border-l-2 border-white/20 pl-6 pr-4 py-3',
      layout === 'vertical' ? 'space-y-2' : 'flex items-center justify-center gap-3',
      className
    )}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          // TODO: Add to user's Discogs wishlist
          alert('Added to wishlist! (Will link to Discogs when user auth is implemented)');
        }}
        className="p-2 rounded-full bg-white/20 hover:bg-blue-500/30 text-white/80 hover:text-blue-300 transition-colors"
        title="Add to Wishlist"
      >
        <EyeIcon className="w-5 h-5" />
        {layout === 'vertical' && <span className="hidden sm:inline ml-2">Wishlist</span>}
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          // TODO: Add to crate functionality
          alert('Added to crate!');
        }}
        className="p-2 rounded-full bg-white/20 hover:bg-blue-500/30 text-white/80 hover:text-blue-300 transition-colors"
        title="Add to Crate"
      >
        <ShoppingCartIcon className="w-5 h-5" />
        {layout === 'vertical' && <span className="hidden sm:inline ml-2">Crate</span>}
      </Button>
      
      <Button
        asChild
        className={cn(
          'bg-blue-600 text-white hover:bg-blue-700 transition-colors text-center',
          layout === 'vertical' ? 'w-full' : 'flex-1 py-2 px-4 text-sm'
        )}
      >
        <a
          href={release.uri.startsWith('http') ? release.uri : `https://www.discogs.com${release.uri}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy on Discogs
        </a>
      </Button>
    </div>
  );
};