import { NextRequest, NextResponse } from 'next/server';

const DISCOGS_API_BASE = 'https://api.discogs.com';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'genre:electronic';
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('per_page') || '50';

  const url = new URL(`${DISCOGS_API_BASE}/database/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'release');
  url.searchParams.set('page', page);
  url.searchParams.set('per_page', perPage);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Rotation/1.0 +https://rotation.app',
        'Authorization': `Discogs token=${process.env.DISCOGS_USER_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Discogs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Discogs API' },
      { status: 500 }
    );
  }
}