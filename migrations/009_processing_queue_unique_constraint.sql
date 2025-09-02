-- Migration 009: Add unique constraint to processing_queue to prevent duplicates
-- This prevents duplicate queue entries for the same store + discogs_id combination

-- First, remove any existing duplicates (keep the oldest one for each combination)
DELETE FROM processing_queue
WHERE id NOT IN (
    SELECT MIN(id)
    FROM processing_queue
    GROUP BY store_username, discogs_id
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE processing_queue
ADD CONSTRAINT uq_processing_queue_store_discogs
UNIQUE (store_username, discogs_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processing_queue_store_status 
ON processing_queue (store_username, status, priority DESC, queued_at ASC);