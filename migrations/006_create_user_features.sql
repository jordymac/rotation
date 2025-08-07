-- Migration: Create user-driven features tables
-- Favorites, play history, feedback, and user interactions

-- Create enum types for user features
CREATE TYPE feedback_type AS ENUM ('bad_match', 'missing_audio', 'wrong_metadata', 'copyright_issue', 'quality_issue', 'suggestion');
CREATE TYPE feedback_status AS ENUM ('open', 'in_review', 'resolved', 'dismissed');
CREATE TYPE play_action AS ENUM ('play', 'pause', 'skip', 'complete', 'seek');

-- User favorites/saved items
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    favoritable_type TEXT NOT NULL, -- 'track', 'record', 'store', 'audio_match'
    favoritable_id INTEGER NOT NULL,
    notes TEXT, -- Personal notes about why they favorited it
    is_public BOOLEAN DEFAULT false, -- Whether this favorite is visible to others
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, favoritable_type, favoritable_id)
);

-- User play history and listening behavior
CREATE TABLE IF NOT EXISTS play_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Allow anonymous plays
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    audio_match_id INTEGER REFERENCES audio_matches(id) ON DELETE SET NULL,
    session_id TEXT, -- Group plays in the same listening session
    action play_action NOT NULL,
    position_seconds INTEGER DEFAULT 0, -- Where in the track the action occurred
    duration_listened_seconds INTEGER DEFAULT 0, -- How long they actually listened
    completion_percentage DECIMAL(5,2) DEFAULT 0.00, -- What % of track was played
    source_context TEXT, -- 'feed', 'search', 'store_page', 'recommendation'
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    user_agent TEXT,
    ip_address INET,
    country_code TEXT,
    city TEXT,
    referrer_url TEXT,
    played_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User feedback and flags
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    feedback_type feedback_type NOT NULL,
    status feedback_status DEFAULT 'open',
    subject_type TEXT NOT NULL, -- 'track', 'audio_match', 'record', 'store'
    subject_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    suggested_fix TEXT, -- User's suggestion for fixing the issue
    priority INTEGER DEFAULT 3, -- 1 = high, 5 = low
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional context data
    assigned_to INTEGER REFERENCES users(id), -- Which admin is handling this
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    is_duplicate_of INTEGER REFERENCES feedback(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User collections (playlists/sets)
CREATE TABLE IF NOT EXISTS user_collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_collaborative BOOLEAN DEFAULT false, -- Allow other users to add items
    cover_image_url TEXT,
    color_scheme TEXT, -- Hex color for UI theming
    tags TEXT[] DEFAULT '{}',
    total_tracks INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items within user collections
CREATE TABLE IF NOT EXISTS user_collection_items (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 1, -- Order within the collection
    added_by INTEGER REFERENCES users(id), -- Who added this item (for collaborative collections)
    notes TEXT, -- Personal notes about this track in this collection
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_id, track_id)
);

-- User follows (users following stores or other users)
CREATE TABLE IF NOT EXISTS user_follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followable_type TEXT NOT NULL, -- 'user', 'store'
    followable_id INTEGER NOT NULL,
    notifications_enabled BOOLEAN DEFAULT true,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, followable_type, followable_id)
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferred_audio_platforms TEXT[] DEFAULT '{"youtube", "soundcloud"}', -- Preferred order
    auto_play_enabled BOOLEAN DEFAULT true,
    crossfade_enabled BOOLEAN DEFAULT false,
    crossfade_duration_seconds INTEGER DEFAULT 3,
    volume_level DECIMAL(4,3) DEFAULT 0.75, -- 0.000 to 1.000
    preferred_genres TEXT[] DEFAULT '{}',
    excluded_genres TEXT[] DEFAULT '{}',
    preferred_decades INTEGER[] DEFAULT '{}', -- Array of years like [1970, 1980, 1990]
    feed_algorithm_preference TEXT DEFAULT 'balanced', -- 'discovery', 'balanced', 'familiar'
    show_explicit_content BOOLEAN DEFAULT true,
    data_usage_preference TEXT DEFAULT 'auto', -- 'low', 'auto', 'high'
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    theme_preference TEXT DEFAULT 'dark', -- 'light', 'dark', 'auto'
    language_preference TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_favoritable ON favorites(favoritable_type, favoritable_id);
CREATE INDEX IF NOT EXISTS idx_favorites_is_public ON favorites(is_public);

CREATE INDEX IF NOT EXISTS idx_play_history_user_id ON play_history(user_id);
CREATE INDEX IF NOT EXISTS idx_play_history_track_id ON play_history(track_id);
CREATE INDEX IF NOT EXISTS idx_play_history_audio_match_id ON play_history(audio_match_id);
CREATE INDEX IF NOT EXISTS idx_play_history_session_id ON play_history(session_id);
CREATE INDEX IF NOT EXISTS idx_play_history_played_at ON play_history(played_at);
CREATE INDEX IF NOT EXISTS idx_play_history_action ON play_history(action);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_subject ON feedback(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_feedback_assigned_to ON feedback(assigned_to);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);

CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_is_public ON user_collections(is_public);
CREATE INDEX IF NOT EXISTS idx_user_collections_tags ON user_collections USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_user_collection_items_collection_id ON user_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_user_collection_items_track_id ON user_collection_items(track_id);
CREATE INDEX IF NOT EXISTS idx_user_collection_items_position ON user_collection_items(position);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followable ON user_follows(followable_type, followable_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_play_history_user_track ON play_history(user_id, track_id);
CREATE INDEX IF NOT EXISTS idx_play_history_user_played_at ON play_history(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_type ON favorites(user_id, favoritable_type);

-- Triggers for updated_at
CREATE TRIGGER update_favorites_updated_at 
    BEFORE UPDATE ON favorites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_collections_updated_at 
    BEFORE UPDATE ON user_collections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update collection stats
CREATE OR REPLACE FUNCTION update_collection_stats() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_collections 
        SET total_tracks = total_tracks + 1
        WHERE id = NEW.collection_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_collections 
        SET total_tracks = total_tracks - 1
        WHERE id = OLD.collection_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain collection stats
CREATE TRIGGER update_collection_stats_trigger
    AFTER INSERT OR DELETE ON user_collection_items
    FOR EACH ROW
    EXECUTE FUNCTION update_collection_stats();

-- Comments
COMMENT ON TABLE favorites IS 'User bookmarks for tracks, records, stores, and audio matches';
COMMENT ON TABLE play_history IS 'Detailed listening history and behavior analytics';
COMMENT ON TABLE feedback IS 'User-reported issues and suggestions for improvement';
COMMENT ON TABLE user_collections IS 'User-created playlists and track collections';
COMMENT ON TABLE user_collection_items IS 'Tracks within user collections with ordering';
COMMENT ON TABLE user_follows IS 'User follows for stores and other users';
COMMENT ON TABLE user_preferences IS 'User settings and personalization preferences';

COMMENT ON COLUMN favorites.favoritable_type IS 'Type of entity favorited (track, record, store, audio_match)';
COMMENT ON COLUMN play_history.completion_percentage IS 'Percentage of track that was played (0.00 to 100.00)';
COMMENT ON COLUMN play_history.source_context IS 'Where the play originated (feed, search, store_page, etc.)';
COMMENT ON COLUMN feedback.subject_type IS 'Type of entity the feedback is about';
COMMENT ON COLUMN user_preferences.preferred_audio_platforms IS 'Ordered list of preferred platforms for audio matching';
COMMENT ON COLUMN user_preferences.feed_algorithm_preference IS 'How adventurous the recommendation algorithm should be';