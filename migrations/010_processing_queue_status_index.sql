-- Migration 010: Add index on processing_queue for faster status queries
-- This makes the "what's done" query faster for completed rows

-- Add index for faster lookups by store and status
CREATE INDEX IF NOT EXISTS ix_processing_queue_store_status 
ON processing_queue (store_username, status, priority DESC, queued_at ASC);

-- This index supports queries like:
-- SELECT COUNT(*) FROM processing_queue WHERE store_username = ? AND status = 'completed'
-- SELECT * FROM processing_queue WHERE store_username = ? AND status = 'pending' ORDER BY priority DESC, queued_at ASC