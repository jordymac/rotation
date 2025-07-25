import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Simple in-memory storage (same as discogs-username route)
const userDiscogsUsernames = new Map<string, string>();

const DISCOGS_API_BASE = 'https://api.discogs.com';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const discogsUsername = userDiscogsUsernames.get(userId);
  
  if (!discogsUsername) {
    return NextResponse.json({ 
      error: 'No Discogs username configured. Please set it in your profile.' 
    }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${DISCOGS_API_BASE}/users/${discogsUsername}/collection/folders/0/releases?per_page=50`,
      {
        headers: {
          'User-Agent': 'Rotation/1.0 +https://rotation.app',
          'Authorization': `Discogs token=${process.env.DISCOGS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the collection data to match our interface
    const transformedReleases = data.releases?.map((item: any) => ({
      id: item.basic_information.id,
      title: item.basic_information.title,
      artist: item.basic_information.artists?.[0]?.name || 'Unknown Artist',
      year: item.basic_information.year,
      label: item.basic_information.labels?.[0]?.name || 'Unknown Label',
      genre: item.basic_information.genres || [],
      style: item.basic_information.styles || [],
      thumb: item.basic_information.thumb,
      resource_url: item.basic_information.resource_url,
      uri: item.basic_information.uri,
    })) || [];

    return NextResponse.json({
      results: transformedReleases,
      pagination: data.pagination || {}
    });
  } catch (error) {
    console.error('Error fetching user collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection from Discogs API' },
      { status: 500 }
    );
  }
}