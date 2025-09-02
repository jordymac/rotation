/**
 * Lean "featuring" extractor for music track metadata.
 * Extracts only featuring artists from Discogs-like track data.
 */

type ExtraArtist = { 
  name: string; 
  anv?: string; 
  role?: string; 
  join?: string; 
};

type Track = {
  title?: string;
  artists?: ExtraArtist[];
  extraartists?: ExtraArtist[];
};

/**
 * Normalize a string for case-insensitive deduplication while preserving original casing.
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Get display name for an artist, preferring ANV over name when available.
 */
function getDisplayName(artist: ExtraArtist): string {
  const anv = artist.anv?.trim();
  return (anv && anv.length > 0) ? anv : artist.name.trim();
}

/**
 * Clean a name by trimming whitespace and leading/trailing punctuation.
 */
function cleanName(name: string): string {
  return name.trim().replace(/^[·–\-\s]+|[·–\-\s]+$/g, '').trim();
}

/**
 * Split a featuring string into individual artist names.
 * Handles comma, ampersand, and "and" separators.
 */
function splitFeaturingNames(text: string): string[] {
  return text
    .split(/,|&|\band\b/i)
    .map(name => cleanName(name))
    .filter(name => name.length > 0 && !/^[^\w]+$/.test(name)); // Filter out empty or pure punctuation
}

/**
 * Extract featuring artists from extraartists array.
 * Only includes entries whose role contains "feat" (case-insensitive).
 */
function getFeaturingFromExtraArtists(extraartists: ExtraArtist[] = []): string[] {
  const featuring: string[] = [];
  
  // Regex to match "feat", "feat.", "featuring" etc.
  const featRegex = /\bfeat(?:\.|uring)?\b/i;
  
  for (const artist of extraartists) {
    if (artist.role && featRegex.test(artist.role)) {
      const displayName = getDisplayName(artist);
      if (displayName.length > 0) {
        featuring.push(displayName);
      }
    }
  }
  
  return featuring;
}

/**
 * Extract featuring artists from track title.
 * Captures content inside "(feat. ...)" or "[featuring ...]" etc.
 */
function getFeaturingFromTitle(title: string = ''): string[] {
  const featuring: string[] = [];
  
  // Regex to match featuring in parentheses or brackets
  // Captures: (feat. X), (featuring X), [feat. X], [FEAT. X], etc.
  const titleFeatRegex = /[\(\[]\s*(?:feat\.?|featuring)\s+([^\)\]]+)[\)\]]/gi;
  
  let match;
  while ((match = titleFeatRegex.exec(title)) !== null) {
    const captured = match[1];
    if (captured) {
      const names = splitFeaturingNames(captured);
      featuring.push(...names);
    }
  }
  
  return featuring;
}

/**
 * Extract featuring artists from artists array using join tokens.
 * When an artist has a "feat" join, all subsequent artists in the chain are considered featured.
 */
function getFeaturingFromArtistsJoin(artists: ExtraArtist[] = []): string[] {
  const featuring: string[] = [];
  
  // Regex to match "feat", "feat.", "featuring" in join tokens
  const featJoinRegex = /\bfeat(?:\.|uring)?\b/i;
  
  // Regex to match list continuation tokens (comma, ampersand, "and")
  const listContinuationRegex = /^\s*[,&]\s*$|^\s*and\s*$/i;
  
  let inFeaturingChain = false;
  
  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i];
    
    // Check if this artist's join token indicates featuring
    if (artist.join && featJoinRegex.test(artist.join)) {
      inFeaturingChain = true;
      continue; // This artist is the main artist, not featured
    }
    
    // If we're in a featuring chain, add this artist
    if (inFeaturingChain) {
      const displayName = getDisplayName(artist);
      if (displayName.length > 0) {
        featuring.push(displayName);
      }
      
      // Check if the chain continues
      if (artist.join && !listContinuationRegex.test(artist.join)) {
        // Chain stops if join token is not a list continuation
        inFeaturingChain = false;
      }
    }
  }
  
  return featuring;
}

/**
 * Extract all featuring artists from a track.
 * Combines results from extraartists, title, and artists join chains.
 * Deduplicates case-insensitively while preserving first-seen casing.
 */
export function getFeaturing(track: Track): string[] {
  const allFeaturing: string[] = [];
  const seenKeys = new Set<string>();
  
  // Collect from all sources
  const sources = [
    getFeaturingFromExtraArtists(track.extraartists),
    getFeaturingFromTitle(track.title),
    getFeaturingFromArtistsJoin(track.artists)
  ];
  
  // Deduplicate while preserving first-seen casing
  for (const source of sources) {
    for (const name of source) {
      const key = normalizeKey(name);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allFeaturing.push(name);
      }
    }
  }
  
  return allFeaturing;
}