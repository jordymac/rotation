-- Migration: Create audio matches and metadata cache tables
-- Enhanced audio matching and metadata caching system

-- Create enum types for audio matching
CREATE TYPE match_status AS ENUM ('unverified', 'verified', 'needs_review', 'rejected', 'auto_approved');
CREATE TYPE audio_platform AS ENUM ('youtube', 'soundcloud', 'spotify', 'bandcamp', 'discogs');

-- Enhanced audio matches table (replaces the simple track_matches)
CREATE TABLE IF NOT EXISTS audio_matches (
    id SERIAL PRIMARY KEY,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    platform audio_platform NOT NULL,
    external_id TEXT NOT NULL, -- YouTube video ID, SoundCloud track ID, etc.
    url TEXT NOT NULL,
    title TEXT,
    artist TEXT,
    duration_seconds INTEGER,
    thumbnail_url TEXT,
    embed_url TEXT,
    confidence_score DECIMAL(4,3) NOT NULL, -- 0.000 to 1.000
    status match_status DEFAULT 'unverified',
    match_reason TEXT, -- What made this a good match (title similarity, artist match, etc.)
    quality_score DECIMAL(4,3), -- Audio quality assessment 0.000 to 1.000
    popularity_score INTEGER DEFAULT 0, -- View count, like count, etc.
    is_official BOOLEAN DEFAULT false, -- Official artist upload vs user upload
    is_explicit BOOLEAN DEFAULT false,
    language TEXT,
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(track_id, platform, external_id)
);

-- Metadata cache for heavy-to-fetch data
CREATE TABLE IF NOT EXISTS metadata_cache (
    id SERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'audio_match', 'record', 'track', 'store'
    entity_id INTEGER NOT NULL,
    cache_key TEXT NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
    refresh_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, cache_key)
);

-- Audio match history for tracking changes
CREATE TABLE IF NOT EXISTS audio_match_history (
    id SERIAL PRIMARY KEY,
    audio_match_id INTEGER NOT NULL REFERENCES audio_matches(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'verified', 'rejected', 'updated'
    old_status match_status,
    new_status match_status,
    old_confidence DECIMAL(4,3),
    new_confidence DECIMAL(4,3),
    notes TEXT,
    performed_by INTEGER REFERENCES users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match candidates (temporary storage during matching process)
CREATE TABLE IF NOT EXISTS match_candidates (
    id SERIAL PRIMARY KEY,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL, -- Unique ID for matching session
    platform audio_platform NOT NULL,
    external_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    artist TEXT,
    duration_seconds INTEGER,
    confidence_score DECIMAL(4,3) NOT NULL,
    quality_indicators JSONB DEFAULT '{}'::jsonb, -- Various quality metrics
    metadata JSONB DEFAULT '{}'::jsonb, -- Raw platform data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- Audio quality metrics
CREATE TABLE IF NOT EXISTS audio_quality_metrics (
    id SERIAL PRIMARY KEY,
    audio_match_id INTEGER NOT NULL REFERENCES audio_matches(id) ON DELETE CASCADE,
    bitrate INTEGER,
    sample_rate INTEGER,
    channels INTEGER,
    format TEXT,
    file_size_bytes BIGINT,
    dynamic_range DECIMAL(5,2),
    peak_volume DECIMAL(5,2),
    loudness_lufs DECIMAL(6,2),
    silence_ratio DECIMAL(4,3), -- Percentage of silent portions
    distortion_score DECIMAL(4,3), -- 0.000 = clean, 1.000 = very distorted
    noise_floor DECIMAL(5,2),
    analysis_version TEXT DEFAULT '1.0',
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_matches_track_id ON audio_matches(track_id);
CREATE INDEX IF NOT EXISTS idx_audio_matches_platform ON audio_matches(platform);
CREATE INDEX IF NOT EXISTS idx_audio_matches_status ON audio_matches(status);
CREATE INDEX IF NOT EXISTS idx_audio_matches_confidence_score ON audio_matches(confidence_score);
CREATE INDEX IF NOT EXISTS idx_audio_matches_verified_by ON audio_matches(verified_by);
CREATE INDEX IF NOT EXISTS idx_audio_matches_last_checked_at ON audio_matches(last_checked_at);

CREATE INDEX IF NOT EXISTS idx_metadata_cache_entity ON metadata_cache(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_metadata_cache_expires_at ON metadata_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_metadata_cache_key ON metadata_cache(cache_key);

CREATE INDEX IF NOT EXISTS idx_audio_match_history_match_id ON audio_match_history(audio_match_id);
CREATE INDEX IF NOT EXISTS idx_audio_match_history_performed_by ON audio_match_history(performed_by);
CREATE INDEX IF NOT EXISTS idx_audio_match_history_performed_at ON audio_match_history(performed_at);

CREATE INDEX IF NOT EXISTS idx_match_candidates_track_id ON match_candidates(track_id);
CREATE INDEX IF NOT EXISTS idx_match_candidates_session_id ON match_candidates(session_id);
CREATE INDEX IF NOT EXISTS idx_match_candidates_expires_at ON match_candidates(expires_at);

CREATE INDEX IF NOT EXISTS idx_audio_quality_metrics_match_id ON audio_quality_metrics(audio_match_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audio_matches_track_platform_status ON audio_matches(track_id, platform, status);
CREATE INDEX IF NOT EXISTS idx_audio_matches_status_confidence ON audio_matches(status, confidence_score DESC);

-- Triggers for updated_at
CREATE TRIGGER update_audio_matches_updated_at 
    BEFORE UPDATE ON audio_matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metadata_cache_updated_at 
    BEFORE UPDATE ON metadata_cache 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired candidates
CREATE OR REPLACE FUNCTION cleanup_expired_candidates() RETURNS void AS $$
BEGIN
    DELETE FROM match_candidates WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update audio match history
CREATE OR REPLACE FUNCTION log_audio_match_change() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audio_match_history (audio_match_id, action, new_status, new_confidence, performed_by)
        VALUES (NEW.id, 'created', NEW.status, NEW.confidence_score, NEW.verified_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status OR OLD.confidence_score != NEW.confidence_score THEN
            INSERT INTO audio_match_history (
                audio_match_id, action, old_status, new_status, 
                old_confidence, new_confidence, performed_by
            )
            VALUES (
                NEW.id, 'updated', OLD.status, NEW.status,
                OLD.confidence_score, NEW.confidence_score, NEW.verified_by
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audio match history logging
CREATE TRIGGER audio_match_history_trigger
    AFTER INSERT OR UPDATE ON audio_matches
    FOR EACH ROW
    EXECUTE FUNCTION log_audio_match_change();

-- Comments
COMMENT ON TABLE audio_matches IS 'Enhanced audio matches with platform-specific metadata and quality scores';
COMMENT ON TABLE metadata_cache IS 'Cache for heavy-to-fetch metadata (YouTube descriptions, comments, etc.)';
COMMENT ON TABLE audio_match_history IS 'Audit trail for audio match changes and verifications';
COMMENT ON TABLE match_candidates IS 'Temporary storage for match candidates during processing';
COMMENT ON TABLE audio_quality_metrics IS 'Detailed audio quality analysis for matches';

COMMENT ON COLUMN audio_matches.confidence_score IS 'Match confidence from 0.000 to 1.000';
COMMENT ON COLUMN audio_matches.quality_score IS 'Audio quality assessment from 0.000 to 1.000';
COMMENT ON COLUMN audio_matches.is_official IS 'Whether this is an official artist/label upload';
COMMENT ON COLUMN metadata_cache.entity_type IS 'Type of entity being cached (audio_match, record, etc.)';
COMMENT ON COLUMN metadata_cache.cache_key IS 'Specific data type being cached (description, comments, etc.)';
COMMENT ON COLUMN match_candidates.session_id IS 'Unique identifier for the matching session';
COMMENT ON COLUMN audio_quality_metrics.loudness_lufs IS 'Loudness in LUFS (Loudness Units relative to Full Scale)';