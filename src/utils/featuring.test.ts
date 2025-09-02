/**
 * Tests for featuring extractor utility.
 * Using Vitest for testing framework.
 */

import { describe, it, expect } from 'vitest';
import { getFeaturing } from './featuring';

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

describe('getFeaturing', () => {
  it('should extract featuring artists from extraartists with "Featuring" role', () => {
    const track: Track = {
      extraartists: [
        { name: "Wes Maples", role: "Featuring" },
        { name: "Ledisi", role: "Written-By, Vocals" } // should NOT be included
      ]
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Wes Maples"]);
  });

  it('should extract featuring artists from title with (feat. ...)', () => {
    const track: Track = {
      title: "Canvas (feat. Wes Maples, J*Davey & Bilal)"
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Wes Maples", "J*Davey", "Bilal"]);
  });

  it('should extract featuring artists from artists join chain', () => {
    const track: Track = {
      artists: [
        { name: "Main Artist", join: "feat." },
        { name: "Guest One", join: ", " },
        { name: "Guest Two" } // end of chain
      ]
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Guest One", "Guest Two"]);
  });

  it('should handle bracket variant [FEAT. ...] and casing', () => {
    const track: Track = {
      title: "Track Name [FEAT. KAYTRANADA]"
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["KAYTRANADA"]);
  });

  it('should prefer ANV over name when present', () => {
    const track: Track = {
      extraartists: [
        { name: "Andrés", anv: "Dez Andres", role: "FEATURING" }
      ]
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Dez Andres"]);
  });

  it('should deduplicate mixed sources while preserving first-seen casing', () => {
    const track: Track = {
      title: "[FEAT. KAYTRANADA]",
      extraartists: [
        { name: "kaytranada", role: "Featuring" } // should dedupe, keep first-seen casing
      ]
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["KAYTRANADA"]); // Title comes first, so uppercase is preserved
  });

  it('should NOT include non-featuring roles like Written-By, Vocals, Producer', () => {
    const track: Track = {
      extraartists: [
        { name: "Producer Guy", role: "Producer" },
        { name: "Writer Person", role: "Written-By" },
        { name: "Singer Lady", role: "Vocals" },
        { name: "Featured Artist", role: "Featuring" }
      ]
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Featured Artist"]);
  });

  it('should handle different featuring role variations', () => {
    const track: Track = {
      extraartists: [
        { name: "Artist One", role: "feat." },
        { name: "Artist Two", role: "featuring" },
        { name: "Artist Three", role: "Feat" },
        { name: "Artist Four", role: "FEATURING" }
      ]
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Artist One", "Artist Two", "Artist Three", "Artist Four"]);
  });

  it('should handle title with "featuring" spelling', () => {
    const track: Track = {
      title: "Song Name (featuring Artist One & Artist Two)"
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Artist One", "Artist Two"]);
  });

  it('should handle empty and undefined inputs gracefully', () => {
    const track1: Track = {};
    const track2: Track = {
      title: "",
      artists: [],
      extraartists: []
    };
    
    expect(getFeaturing(track1)).toEqual([]);
    expect(getFeaturing(track2)).toEqual([]);
  });

  it('should clean names and filter out pure punctuation', () => {
    const track: Track = {
      title: "Song (feat. ·Artist One·, –Artist Two–, , &)"
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Artist One", "Artist Two"]);
  });

  it('should handle complex artist join chains with mixed separators', () => {
    const track: Track = {
      artists: [
        { name: "Main Artist", join: "featuring" },
        { name: "Guest One", join: ", " },
        { name: "Guest Two", join: " & " },
        { name: "Guest Three", join: " and " },
        { name: "Guest Four", join: " with " }, // should stop chain here
        { name: "Other Artist" } // not featured
      ]
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Guest One", "Guest Two", "Guest Three"]);
  });

  it('should handle multiple featuring sections in title', () => {
    const track: Track = {
      title: "Song (feat. Artist One) [featuring Artist Two]"
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Artist One", "Artist Two"]);
  });

  it('should handle ANV with empty string preference', () => {
    const track: Track = {
      extraartists: [
        { name: "Real Name", anv: "", role: "featuring" }, // empty ANV, should use name
        { name: "Another Name", anv: "   ", role: "feat." } // whitespace ANV, should use name
      ]
    };
    
    const result = getFeaturing(track);
    expect(result).toEqual(["Real Name", "Another Name"]);
  });
});