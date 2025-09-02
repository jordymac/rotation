import { NextRequest, NextResponse } from 'next/server';

// Simple feed endpoint with mock data to test 9:16 video cards
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const storeId = sp.get('store') || 'general-feed';
  const limit = Math.min(10, parseInt(sp.get('limit') || '5'));

  // Mock vinyl releases with YouTube videos for testing
  const mockReleases = [
    {
      id: 123456,
      title: "Midnight Express",
      artist: "DJ Shadow",
      year: 2022,
      label: "Island Records", 
      genre: ["Electronic", "Hip Hop"],
      style: ["Downtempo", "Trip Hop"],
      thumb: "https://i.discogs.com/example1.jpg",
      tracks: [
        { position: "A1", title: "Midnight Express", duration: "5:23" },
        { position: "A2", title: "City Lights", duration: "4:15" }
      ],
      price: "USD 24.99",
      condition: "Near Mint (NM or M-)",
      audioMatches: [
        {
          trackIndex: 0,
          platform: "youtube",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          confidence: 85
        }
      ]
    },
    {
      id: 789012,
      title: "Ocean Drive",
      artist: "Disclosure",
      year: 2020,
      label: "PMR Records",
      genre: ["Electronic"],
      style: ["House", "UK Garage"],
      thumb: "https://i.discogs.com/example2.jpg", 
      tracks: [
        { position: "1", title: "Ocean Drive", duration: "3:45" },
        { position: "2", title: "Sunset Boulevard", duration: "4:02" }
      ],
      price: "USD 32.50",
      condition: "Mint (M)",
      audioMatches: [
        {
          trackIndex: 0,
          platform: "youtube", 
          url: "https://www.youtube.com/watch?v=8ELbX5CMomE",
          confidence: 92
        }
      ]
    }
  ];

  const results = mockReleases.slice(0, limit);

  return NextResponse.json({
    success: true,
    results,
    pagination: {
      cursor: 0,
      limit,
      hasNext: false,
      nextCursor: null,
      total: results.length
    },
    store: {
      id: storeId,
      username: storeId
    },
    audioMatchesCount: results.reduce((sum, r) => sum + (r.audioMatches?.length || 0), 0)
  });
}