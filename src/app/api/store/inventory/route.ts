import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminStores } from '@/lib/storage';

const DISCOGS_API_BASE = 'https://api.discogs.com';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the first admin store for testing
  const stores = adminStores.getAll();
  
  if (stores.length === 0) {
    return NextResponse.json({ 
      error: 'No stores configured. Please add a store in the admin panel.' 
    }, { status: 400 });
  }

  // Use the first store for now
  const store = stores[0];
  const discogsUsername = store.username;
  
  console.log('Fetching inventory for store:', discogsUsername);

  try {
    // Fetch store inventory - only real data
    let data = { listings: [] };
    
    try {
      const response = await fetch(
        `${DISCOGS_API_BASE}/users/${discogsUsername}/inventory?status=For%20Sale&per_page=50`,
        {
          headers: {
            'User-Agent': 'Rotation/1.0 +https://rotation.app',
            'Authorization': `Discogs token=${process.env.DISCOGS_USER_TOKEN}`,
          },
        }
      );

      if (response.ok) {
        data = await response.json();
      } else {
        console.log(`Discogs API returned ${response.status}`);
      }
    } catch (fetchError) {
      console.log('Discogs API fetch failed:', fetchError);
    }
    
    // Only use real data - no mock fallback
    if (false) { // Disabled mock data
      const mockListings = [
        {
          id: "249504",
          release: {
            id: 249504,
            title: "Never, Neverland",
            artist: "Annihilator",
            year: 1990,
            label: ["Roadrunner Records"],
            genre: ["Heavy Metal", "Thrash"],
            format: "Vinyl",
            thumb: "https://i.discogs.com/r/jpeg/400x400/1990/rs:fit/g:sm/q:40/h:150/w:150/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTI0OTUw/NC0xMjQ0MzI2MzAy/LmpwZWc.jpeg",
            resource_url: "https://api.discogs.com/releases/249504"
          },
          price: { currency: "USD", value: 25.99 },
          condition: "Near Mint (NM or M-)",
          sleeve_condition: "Very Good Plus (VG+)",
          comments: "Original pressing in excellent condition"
        },
        {
          id: "1234567",
          release: {
            id: 1234567,
            title: "Thriller",
            artist: "Michael Jackson",
            year: 1982,
            label: ["Epic Records"],
            genre: ["Pop", "R&B", "Funk"],
            format: "Vinyl",
            thumb: "https://i.discogs.com/r/jpeg/400x400/1982/rs:fit/g:sm/q:40/h:150/w:150/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTEyMzQ1/NjctMTIzNDU2Nzg5/MC5qcGVn.jpeg",
            resource_url: "https://api.discogs.com/releases/1234567"
          },
          price: { currency: "USD", value: 45.00 },
          condition: "Mint (M)",
          sleeve_condition: "Mint (M)",
          comments: "Sealed original pressing"
        },
        {
          id: "987654",
          release: {
            id: 987654,
            title: "Dark Side of the Moon",
            artist: "Pink Floyd",
            year: 1973,
            label: ["Harvest Records"],
            genre: ["Progressive Rock", "Psychedelic Rock"],
            format: "Vinyl",
            thumb: "https://i.discogs.com/r/jpeg/400x400/1973/rs:fit/g:sm/q:40/h:150/w:150/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTk4NzY1/NC0xMjM0NTY3ODkw/LmpwZWc.jpeg",
            resource_url: "https://api.discogs.com/releases/987654"
          },
          price: { currency: "USD", value: 35.99 },
          condition: "Very Good Plus (VG+)",
          sleeve_condition: "Very Good (VG)",
          comments: "Classic album, some light wear"
        }
      ];

      data.listings = mockListings;
      data.pagination = {
        page: 1,
        pages: 1,
        per_page: 50,
        items: mockListings.length,
        urls: {}
      };
    }
    
    // Transform the inventory data to match our interface
    const transformedReleases = data.listings?.map((item: any) => ({
      id: item.release.id,
      title: item.release.title,
      artist: item.release.artist || 'Unknown Artist',
      year: item.release.year,
      label: Array.isArray(item.release.label) ? item.release.label[0] : (item.release.label || 'Unknown Label'),
      genre: item.release.genre || [],
      style: item.release.style || [],
      thumb: item.release.thumb,
      resource_url: item.release.resource_url,
      uri: `/releases/${item.release.id}`,
      price: item.price?.value ? `${item.price.currency} ${item.price.value}` : null,
      condition: item.condition,
      sleeve_condition: item.sleeve_condition,
      comments: item.comments,
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