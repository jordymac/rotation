/**
 * Example React component showing how to use the featuring extractor.
 */

import React from 'react';
import { getFeaturing } from '@/utils/featuring';

type ExtraArtist = { 
  name: string; 
  anv?: string; 
  role?: string; 
  join?: string; 
};

type Track = {
  title?: string;
  artists?: ExtraArtist[];
  extraartists?: ExtraArtist[];
};

interface TrackCardProps {
  track: Track;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track }) => {
  const feats = getFeaturing(track);
  
  return (
    <div className="track-card">
      <div className="title">{track.title}</div>
      {feats.length > 0 && (
        <div className="subtitle">feat. {feats.join(", ")}</div>
      )}
    </div>
  );
};

// Example usage with sample data:
export const ExampleUsage: React.FC = () => {
  const sampleTrack: Track = {
    title: "Canvas (feat. Wes Maples)",
    extraartists: [
      { name: "J*Davey", role: "Featuring" },
      { name: "Producer Name", role: "Producer" } // won't be included
    ]
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Track Card Example</h2>
      <TrackCard track={sampleTrack} />
      
      {/* Would render:
          <div className="track-card">
            <div className="title">Canvas (feat. Wes Maples)</div>
            <div className="subtitle">feat. Wes Maples, J*Davey</div>
          </div>
      */}
    </div>
  );
};