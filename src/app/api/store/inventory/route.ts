import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userDiscogsUsernames } from '@/lib/storage';

const DISCOGS_API_BASE = 'https://api.discogs.com';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const discogsUsername = userDiscogsUsernames.get(userId);
  
  console.log('Fetching inventory for user:', userId);
  console.log('Stored username:', discogsUsername);
  console.log('All stored usernames:', Array.from(userDiscogsUsernames.entries()));
  
  if (!discogsUsername) {
    return NextResponse.json({ 
      error: 'No Discogs store configured. Please set your store username in your profile.' 
    }, { status: 400 });
  }

  try {
    // Fetch store inventory (items for sale) instead of collection
    const response = await fetch(
      `${DISCOGS_API_BASE}/users/${discogsUsername}/inventory?status=For%20Sale&per_page=50`,
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
    
    // Transform the inventory data to match our interface
    const transformedReleases = data.listings?.map((item: any) => ({
      id: item.release.id,
      title: item.release.title,
      artist: item.release.artist || 'Unknown Artist',
      year: item.release.year,
      label: item.release.label || 'Unknown Label',
      genre: item.release.format ? [item.release.format] : [],
      style: item.condition ? [item.condition] : [],
      thumb: item.release.thumb,
      resource_url: item.release.resource_url,
      uri: `/releases/${item.release.id}`,
      price: item.price?.value ? `${item.price.currency} ${item.price.value}` : null,
      condition: item.condition,
      sleeve_condition: item.sleeve_condition,
    })) || [];

    return NextResponse.json({
      results: transformedReleases,
      pagination: data.pagination || {}
    });
  } catch (error) {
    console.error('Error fetching store inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory from Discogs API' },
      { status: 500 }
    );
  }
}