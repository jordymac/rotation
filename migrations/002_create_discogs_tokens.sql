-- Migration: Create discogs_tokens table
-- This table stores encrypted Discogs OAuth tokens for users

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS discogs_tokens (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    access_secret TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'oauth',
    expires_at TIMESTAMPTZ,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_discogs_tokens_username 
ON discogs_tokens (username);

-- Index for token expiration management
CREATE INDEX IF NOT EXISTS idx_discogs_tokens_expires_at 
ON discogs_tokens (expires_at) 
WHERE expires_at IS NOT NULL;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_token(token TEXT) 
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        encrypt(
            token::bytea, 
            current_setting('app.encryption_key', true)::bytea, 
            'aes'
        ), 
        'base64'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token TEXT) 
RETURNS TEXT AS $$
BEGIN
    RETURN convert_from(
        decrypt(
            decode(encrypted_token, 'base64'), 
            current_setting('app.encryption_key', true)::bytea, 
            'aes'
        ), 
        'utf8'
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_discogs_tokens_updated_at 
    BEFORE UPDATE ON discogs_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE discogs_tokens IS 'Stores encrypted Discogs OAuth tokens for authenticated users';
COMMENT ON COLUMN discogs_tokens.username IS 'Discogs username (unique identifier)';
COMMENT ON COLUMN discogs_tokens.access_token IS 'Encrypted OAuth access token';
COMMENT ON COLUMN discogs_tokens.access_secret IS 'Encrypted OAuth access secret';
COMMENT ON COLUMN discogs_tokens.refresh_token IS 'Encrypted OAuth refresh token (if available)';
COMMENT ON COLUMN discogs_tokens.token_type IS 'Type of token (oauth, personal, etc.)';
COMMENT ON COLUMN discogs_tokens.expires_at IS 'Token expiration timestamp (if applicable)';
COMMENT ON COLUMN discogs_tokens.scope IS 'OAuth scope granted to the token';
COMMENT ON COLUMN discogs_tokens.last_used_at IS 'Timestamp of last token usage for monitoring';