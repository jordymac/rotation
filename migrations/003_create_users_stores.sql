-- Migration: Create users and stores tables
-- Core entities for authentication and store management

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'store_manager', 'general_user');
CREATE TYPE store_status AS ENUM ('active', 'pending', 'suspended', 'inactive');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'general_user',
    profile_image_url TEXT,
    bio TEXT,
    location TEXT,
    website_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table  
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    discogs_username TEXT NOT NULL UNIQUE,
    discogs_store_id TEXT,
    owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status store_status DEFAULT 'pending',
    description TEXT,
    website_url TEXT,
    location TEXT,
    logo_url TEXT,
    banner_url TEXT,
    contact_email TEXT,
    phone TEXT,
    business_hours JSONB,
    shipping_info JSONB,
    policies TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_releases INTEGER DEFAULT 0,
    verified_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    sync_frequency_hours INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store managers (many-to-many relationship between users and stores)
CREATE TABLE IF NOT EXISTS store_managers (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'manager', -- manager, admin, staff
    permissions JSONB DEFAULT '[]'::jsonb,
    invited_by INTEGER REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_discogs_username ON stores(discogs_username);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_owner_user_id ON stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stores_last_sync_at ON stores(last_sync_at);

CREATE INDEX IF NOT EXISTS idx_store_managers_store_id ON store_managers(store_id);
CREATE INDEX IF NOT EXISTS idx_store_managers_user_id ON store_managers(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at 
    BEFORE UPDATE ON stores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_managers_updated_at 
    BEFORE UPDATE ON store_managers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE users IS 'User accounts with authentication and profile information';
COMMENT ON TABLE stores IS 'Record stores with Discogs integration and business information';
COMMENT ON TABLE store_managers IS 'Many-to-many relationship for store management permissions';

COMMENT ON COLUMN users.role IS 'User role: admin, store_manager, general_user';
COMMENT ON COLUMN stores.discogs_username IS 'Discogs marketplace username for API integration';
COMMENT ON COLUMN stores.sync_frequency_hours IS 'How often to sync inventory from Discogs (in hours)';
COMMENT ON COLUMN store_managers.permissions IS 'JSON array of specific permissions for this user in this store';