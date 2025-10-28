import { NextResponse } from 'next/server';

const DISCOGS_API_BASE = 'https://api.discogs.com';

export async function GET() {
  // TODO: Add authentication when implementing Discogs OAuth (Phase 2)
  // For now, this endpoint is disabled - will return error

  return NextResponse.json({
    error: 'Collection feature requires authentication. Coming in Phase 2 with Discogs OAuth.'
  }, { status: 501 }); // 501 Not Implemented

  /*
  Future implementation with Discogs OAuth - code preserved for Phase 2:

  const { userId, discogsUsername } = await getDiscogsAuth();

  const response = await fetch(
    `${DISCOGS_API_BASE}/users/${discogsUsername}/collection/folders/0/releases?per_page=50`,
    {
      headers: {
        'User-Agent': 'Rotation/1.0 +https://rotation.app',
        'Authorization': `Discogs token=${process.env.DISCOGS_USER_TOKEN}`,
      },
    }
  );

  const data = await response.json();
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
  */
}