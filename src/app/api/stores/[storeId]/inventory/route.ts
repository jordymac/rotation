import { NextRequest, NextResponse } from 'next/server';
import { adminStores } from '@/lib/storage';

const DISCOGS_API_BASE = 'https://api.discogs.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const { storeId } = params;
    
    // Handle demo store case
    if (storeId === 'demo-store') {
      const demoStore = {
        id: 'demo-store',
        username: 'Demo Record Store'
      };
      
      // Use mock data for demo store
      const mockListings = [
        {
          id: "249504",
          release: {
            id: 249504,
            title: "Never, Neverland",
            artist: "Annihilator",
            year: 1990,
            label: ["Roadrunner Records"],
            format: "Vinyl",
            genre: ["Metal", "Thrash Metal"],
            style: ["Heavy Metal", "Thrash"],
            thumb: "https://i.discogs.com/r/jpeg/400x400/1990/rs:fit/g:sm/q:40/h:150/w:150/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy1SLTI0OTUw/NC0xMjQ0MzI2MzAy/LmpwZWc.jpeg",
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
            format: "Vinyl",
            genre: ["Pop", "R&B"],
            style: ["Pop Rock", "Soul"],
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
            format: "Vinyl",
            genre: ["Rock", "Progressive Rock"],
            style: ["Psychedelic Rock", "Art Rock"],
            thumb: "https://i.discogs.com/r/jpeg/400x400/1973/rs:fit/g:sm/q:40/h:150/w:150/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTk4NzY1/NC0xMjM0NTY3ODkw/LmpwZWc.jpeg",
            resource_url: "https://api.discogs.com/releases/987654"
          },
          price: { currency: "USD", value: 35.99 },
          condition: "Very Good Plus (VG+)",
          sleeve_condition: "Very Good (VG)",
          comments: "Classic album, some light wear"
        }
      ];

      const transformedReleases = mockListings.map((item: any) => ({
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
        store: {
          id: demoStore.id,
          username: demoStore.username
        }
      }));

      return NextResponse.json({
        results: transformedReleases,
        pagination: {
          page: 1,
          pages: 1,
          per_page: 50,
          items: mockListings.length,
          urls: {}
        },
        store: demoStore
      });
    }

    // Get the store from admin stores
    const stores = adminStores.getAll();
    const store = stores.find(s => s.id === storeId);
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    console.log('Fetching inventory for store:', store.username);
    
    // Try to fetch store inventory, but fallback to mock data if it fails
    let data: any = { listings: [] };
    
    try {
      const response = await fetch(
        `${DISCOGS_API_BASE}/users/${store.username}/inventory?status=For%20Sale&per_page=50`,
        {
          headers: {
            'User-Agent': 'Rotation/1.0 +https://rotation.app',
            'Authorization': `Discogs token=${process.env.DISCOGS_TOKEN}`,
          },
        }
      );

      if (response.ok) {
        data = await response.json();
      } else {
        console.log(`Discogs API returned ${response.status}, using mock data`);
      }
    } catch (fetchError) {
      console.log('Discogs API fetch failed, using mock data:', fetchError);
    }
    
    // If no real inventory, use mock data for development
    if (!data.listings || data.listings.length === 0) {
      const mockListings = [
        {
          id: "249504",
          release: {
            id: 249504,
            title: "Never, Neverland",
            artist: "Annihilator",
            year: 1990,
            label: ["Roadrunner Records"],
            format: "Vinyl",
            genre: ["Metal", "Thrash Metal"],
            style: ["Heavy Metal", "Thrash"],
            thumb: "https://i.discogs.com/r/jpeg/400x400/1990/rs:fit/g:sm/q:40/h:150/w:150/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy1SLTI0OTUw/NC0xMjQ0MzI2MzAy/LmpwZWc.jpeg",
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
            format: "Vinyl",
            genre: ["Pop", "R&B"],
            style: ["Pop Rock", "Soul"],
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
            format: "Vinyl",
            genre: ["Rock", "Progressive Rock"],
            style: ["Psychedelic Rock", "Art Rock"],
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
      store: {
        id: store.id,
        username: store.username
      }
    })) || [];

    return NextResponse.json({
      results: transformedReleases,
      pagination: data.pagination || {},
      store: {
        id: store.id,
        username: store.username
      }
    });
  } catch (error) {
    console.error('Error fetching store inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}