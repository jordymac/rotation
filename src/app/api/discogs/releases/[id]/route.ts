import { NextRequest, NextResponse } from 'next/server';

const DISCOGS_API_BASE = 'https://api.discogs.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const response = await fetch(`${DISCOGS_API_BASE}/releases/${id}`, {
      headers: {
        'User-Agent': 'Rotation/1.0 +https://rotation.app',
        'Authorization': `Discogs token=${process.env.DISCOGS_TOKEN}`,
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
      { error: 'Failed to fetch release from Discogs API' },
      { status: 500 }
    );
  }
}