-- Migration 011: Create admin_stores table
-- This table manages the stores that are added by administrators

CREATE TABLE IF NOT EXISTS admin_stores (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  added_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_stores_username ON admin_stores(username);
CREATE INDEX IF NOT EXISTS idx_admin_stores_added_at ON admin_stores(added_at);

-- Insert any existing data if needed (this migration is idempotent)