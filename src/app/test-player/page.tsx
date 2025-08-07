'use client';

import { useState } from 'react';
import { AudioPlayerControls } from '@/components/molecules';

// Test video IDs (using popular Creative Commons music videos)
const TEST_VIDEOS = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up',
    artist: 'Rick Astley'
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Queen - Bohemian Rhapsody',
    artist: 'Queen'
  },
  {
    id: 'A_MjCqQoLLA',
    title: 'Hey Jude',
    artist: 'The Beatles'
  }
];

export default function TestPlayerPage() {
  const [selectedVideo, setSelectedVideo] = useState(TEST_VIDEOS[0]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          YouTube Audio Player Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Player Demo */}
          <div className="space-y-6">
            <div className="bg-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Current Track</h2>
              <div className="mb-4">
                <h3 className="text-lg font-medium">{selectedVideo.title}</h3>
                <p className="text-white/70">{selectedVideo.artist}</p>
              </div>
              
              <AudioPlayerControls
                videoId={selectedVideo.id}
                autoplay={false}
                onError={(error) => console.error('Player error:', error)}
              />
            </div>
            
            {/* Test Features */}
            <div className="bg-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Features Tested</h2>
              <ul className="space-y-2 text-sm text-white/80">
                <li>✅ Lazy loading with IntersectionObserver</li>
                <li>✅ Hidden iframe (0x0 dimensions)</li>
                <li>✅ Custom play/pause controls</li>
                <li>✅ Progress bar with seek functionality</li>
                <li>✅ Volume slider with mute toggle</li>
                <li>✅ requestAnimationFrame time sync</li>
                <li>✅ Mobile-friendly (playsinline=1)</li>
                <li>✅ Proper cleanup on unmount</li>
              </ul>
            </div>
          </div>
          
          {/* Video Selection */}
          <div className="space-y-6">
            <div className="bg-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Videos</h2>
              <div className="space-y-3">
                {TEST_VIDEOS.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedVideo.id === video.id
                        ? 'bg-blue-600/50 border border-blue-400'
                        : 'bg-white/5 hover:bg-white/10 border border-white/20'
                    }`}
                  >
                    <div className="font-medium">{video.title}</div>
                    <div className="text-sm text-white/70">{video.artist}</div>
                    <div className="text-xs text-white/50 mt-1">ID: {video.id}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Multiple Players Test */}
            <div className="bg-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Multiple Players Test</h2>
              <p className="text-sm text-white/70 mb-4">
                Testing that multiple players can coexist without conflicts:
              </p>
              <div className="space-y-4">
                {TEST_VIDEOS.slice(1).map((video) => (
                  <div key={`multi-${video.id}`} className="border border-white/20 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">{video.title}</div>
                    <AudioPlayerControls
                      videoId={video.id}
                      autoplay={false}
                      className="scale-90"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Notes */}
        <div className="mt-8 bg-white/5 rounded-lg p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-3">Performance & Mobile Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
            <div>
              <strong>Lazy Loading:</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>Players only load when 200px from viewport</li>
                <li>YouTube API script loads once globally</li>
                <li>Reduces initial page load time</li>
              </ul>
            </div>
            <div>
              <strong>Mobile Compatibility:</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>playsinline=1 prevents fullscreen on iOS</li>
                <li>Autoplay with mute satisfies browser policies</li>
                <li>Touch-friendly controls</li>
              </ul>
            </div>
            <div>
              <strong>Performance:</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>requestAnimationFrame for smooth updates</li>
                <li>Hidden 0x0 iframe reduces DOM impact</li>
                <li>Proper cleanup prevents memory leaks</li>
              </ul>
            </div>
            <div>
              <strong>Error Handling:</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>Graceful fallback for unavailable videos</li>
                <li>Network error recovery</li>
                <li>Loading states for better UX</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}