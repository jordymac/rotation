export interface DiscogsTrack {
  title: string;
  duration: string;
  position: string;
  artists?: Array<{
    name: string;
    id: number;
  }>;
}

export interface DiscogsRelease {
  id: number;
  title: string;
  artist: string;
  year: number;
  label: string;
  country?: string;
  genre: string[];
  style: string[];
  thumb: string;
  resource_url: string;
  uri: string;
  price?: string;
  condition?: string;
  sleeve_condition?: string;
  tracks?: DiscogsTrack[];
}

export interface DiscogsSearchResult {
  results: DiscogsRelease[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
    urls: {
      next?: string;
      prev?: string;
    };
  };
}


export async function searchReleases(
  query: string,
  page: number = 1,
  perPage: number = 50
): Promise<DiscogsSearchResult> {
  const url = new URL('/api/discogs/search', window.location.origin);
  url.searchParams.set('q', query);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('per_page', perPage.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getRelease(id: number): Promise<DiscogsRelease> {
  const response = await fetch(`/api/discogs/releases/${id}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getStoreInventory(): Promise<DiscogsSearchResult> {
  const response = await fetch('/api/store/inventory');

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}