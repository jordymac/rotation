-- Migration: Create track_matches table
-- This table stores verified audio matches for tracks to avoid repeated API calls

CREATE TABLE IF NOT EXISTS track_matches (
    id SERIAL PRIMARY KEY,
    release_id BIGINT NOT NULL,
    track_index INTEGER NOT NULL,
    platform TEXT NOT NULL,
    match_url TEXT NOT NULL,
    confidence REAL NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT false,
    verified_by TEXT,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to ensure one match per track
ALTER TABLE track_matches 
ADD CONSTRAINT unique_track_match 
UNIQUE (release_id, track_index);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_track_matches_release_track 
ON track_matches (release_id, track_index);

-- Index for platform filtering
CREATE INDEX IF NOT EXISTS idx_track_matches_platform 
ON track_matches (platform);

-- Index for approved matches
CREATE INDEX IF NOT EXISTS idx_track_matches_approved 
ON track_matches (approved);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_track_matches_updated_at 
    BEFORE UPDATE ON track_matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE track_matches IS 'Stores verified audio matches for tracks to avoid repeated API calls';
COMMENT ON COLUMN track_matches.release_id IS 'Discogs release ID';
COMMENT ON COLUMN track_matches.track_index IS 'Zero-based track index within the release';
COMMENT ON COLUMN track_matches.platform IS 'Platform where match was found (youtube, soundcloud, etc.)';
COMMENT ON COLUMN track_matches.match_url IS 'URL of the matched audio content';
COMMENT ON COLUMN track_matches.confidence IS 'Confidence score of the match (0.0 to 1.0)';
COMMENT ON COLUMN track_matches.approved IS 'Whether the match has been manually verified';
COMMENT ON COLUMN track_matches.verified_by IS 'User ID or identifier of who verified the match';