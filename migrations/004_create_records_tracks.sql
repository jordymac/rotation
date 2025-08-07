-- Migration: Create records and tracks tables
-- Core content entities for storing Discogs metadata

-- Create enum types for records
CREATE TYPE record_status AS ENUM ('active', 'sold', 'reserved', 'draft', 'removed');
CREATE TYPE record_condition AS ENUM ('Mint (M)', 'Near Mint (NM or M-)', 'Very Good Plus (VG+)', 'Very Good (VG)', 'Good Plus (G+)', 'Good (G)', 'Fair (F)', 'Poor (P)');
CREATE TYPE sleeve_condition AS ENUM ('Mint (M)', 'Near Mint (NM or M-)', 'Very Good Plus (VG+)', 'Very Good (VG)', 'Good Plus (G+)', 'Good (G)', 'Fair (F)', 'Poor (P)', 'No Cover');

-- Records table (catalog releases, not individual copies)
CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY,
    discogs_release_id BIGINT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    artist_sort TEXT, -- For proper alphabetical sorting
    label TEXT,
    catalog_number TEXT,
    release_year INTEGER,
    release_date DATE,
    country TEXT,
    genres TEXT[] DEFAULT '{}',
    styles TEXT[] DEFAULT '{}',
    format TEXT, -- Vinyl, CD, Cassette, etc.
    format_details JSONB, -- size, rpm, special editions, etc.
    images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs from Discogs
    videos JSONB DEFAULT '[]'::jsonb, -- Array of video URLs from Discogs
    notes TEXT,
    data_quality TEXT, -- Discogs data quality rating
    master_id BIGINT, -- Discogs master release ID
    master_url TEXT,
    discogs_url TEXT,
    barcode TEXT,
    total_tracks INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    metadata_last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store inventory items (individual copies of records)
CREATE TABLE IF NOT EXISTS store_inventory (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    discogs_listing_id BIGINT UNIQUE, -- Discogs marketplace listing ID
    status record_status DEFAULT 'active',
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    condition record_condition,
    sleeve_condition sleeve_condition,
    description TEXT, -- Seller notes about condition, pressing details, etc.
    quantity INTEGER DEFAULT 1,
    weight_grams INTEGER,
    ships_from TEXT,
    shipping_cost DECIMAL(10,2),
    allow_offers BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false, -- Store can feature certain items
    view_count INTEGER DEFAULT 0,
    wishlist_count INTEGER DEFAULT 0,
    listed_at TIMESTAMPTZ DEFAULT NOW(),
    sold_at TIMESTAMPTZ,
    reserved_until TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, discogs_listing_id)
);

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    position TEXT NOT NULL, -- A1, B2, 1-01, etc.
    title TEXT NOT NULL,
    duration_seconds INTEGER,
    duration_display TEXT, -- Human readable duration like "3:45"
    artists JSONB DEFAULT '[]'::jsonb, -- Array of artist objects with names and roles
    credits JSONB DEFAULT '[]'::jsonb, -- Producer, engineer, etc.
    track_index INTEGER, -- 0-based index for matching with external services
    side_index INTEGER, -- For vinyl: which side (A=0, B=1, etc.)
    track_on_side INTEGER, -- Position within the side
    bpm INTEGER,
    key_signature TEXT,
    genre_tags TEXT[] DEFAULT '{}',
    mood_tags TEXT[] DEFAULT '{}',
    instrument_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_records_discogs_release_id ON records(discogs_release_id);
CREATE INDEX IF NOT EXISTS idx_records_artist ON records(artist);
CREATE INDEX IF NOT EXISTS idx_records_artist_sort ON records(artist_sort);
CREATE INDEX IF NOT EXISTS idx_records_release_year ON records(release_year);
CREATE INDEX IF NOT EXISTS idx_records_label ON records(label);
CREATE INDEX IF NOT EXISTS idx_records_genres ON records USING GIN (genres);
CREATE INDEX IF NOT EXISTS idx_records_styles ON records USING GIN (styles);
CREATE INDEX IF NOT EXISTS idx_records_format ON records(format);

CREATE INDEX IF NOT EXISTS idx_store_inventory_store_id ON store_inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_store_inventory_record_id ON store_inventory(record_id);
CREATE INDEX IF NOT EXISTS idx_store_inventory_status ON store_inventory(status);
CREATE INDEX IF NOT EXISTS idx_store_inventory_price ON store_inventory(price);
CREATE INDEX IF NOT EXISTS idx_store_inventory_condition ON store_inventory(condition);
CREATE INDEX IF NOT EXISTS idx_store_inventory_featured ON store_inventory(featured);
CREATE INDEX IF NOT EXISTS idx_store_inventory_listed_at ON store_inventory(listed_at);
CREATE INDEX IF NOT EXISTS idx_store_inventory_discogs_listing_id ON store_inventory(discogs_listing_id);

CREATE INDEX IF NOT EXISTS idx_tracks_record_id ON tracks(record_id);
CREATE INDEX IF NOT EXISTS idx_tracks_position ON tracks(position);
CREATE INDEX IF NOT EXISTS idx_tracks_track_index ON tracks(track_index);
CREATE INDEX IF NOT EXISTS idx_tracks_bpm ON tracks(bpm);
CREATE INDEX IF NOT EXISTS idx_tracks_genre_tags ON tracks USING GIN (genre_tags);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_store_inventory_store_status_price ON store_inventory(store_id, status, price);
CREATE INDEX IF NOT EXISTS idx_tracks_record_position ON tracks(record_id, position);

-- Triggers for updated_at
CREATE TRIGGER update_records_updated_at 
    BEFORE UPDATE ON records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_inventory_updated_at 
    BEFORE UPDATE ON store_inventory 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at 
    BEFORE UPDATE ON tracks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE records IS 'Catalog releases from Discogs - master record metadata';
COMMENT ON TABLE store_inventory IS 'Individual store inventory items - specific copies for sale';
COMMENT ON TABLE tracks IS 'Individual tracks within records with metadata';

COMMENT ON COLUMN records.discogs_release_id IS 'Unique Discogs release identifier';
COMMENT ON COLUMN records.artist_sort IS 'Artist name formatted for alphabetical sorting';
COMMENT ON COLUMN records.format_details IS 'JSON object with format-specific details (size, RPM, special editions)';
COMMENT ON COLUMN records.images IS 'Array of Discogs image URLs';
COMMENT ON COLUMN records.videos IS 'Array of Discogs video URLs';

COMMENT ON COLUMN store_inventory.discogs_listing_id IS 'Discogs marketplace listing ID';
COMMENT ON COLUMN store_inventory.featured IS 'Whether store has featured this item';
COMMENT ON COLUMN store_inventory.condition IS 'Record condition using Discogs grading standards';
COMMENT ON COLUMN store_inventory.sleeve_condition IS 'Sleeve/cover condition using Discogs grading standards';

COMMENT ON COLUMN tracks.position IS 'Track position as shown on release (A1, B2, 1-01, etc.)';
COMMENT ON COLUMN tracks.track_index IS 'Zero-based index for matching with external audio services';
COMMENT ON COLUMN tracks.artists IS 'JSON array of artist objects with names and roles';
COMMENT ON COLUMN tracks.credits IS 'JSON array of production credits (producer, engineer, etc.)';