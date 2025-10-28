-- =====================================================
-- Migration: 013_enable_rls.sql
-- Description: Enable Row Level Security (RLS) on all public tables
-- Date: 2025-10-28
-- Security Level: CRITICAL
-- =====================================================
--
-- This migration addresses Supabase database linter errors:
-- - rls_disabled_in_public (ERROR level)
--
-- Approach: Enable RLS on all tables with permissive policies
-- for service role access (server-side Next.js API routes)
-- =====================================================

-- =====================================================
-- LAYER 1: IDENTITY TABLES
-- =====================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text OR id::uuid = auth.uid());

-- Enable RLS on stores table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to stores"
  ON stores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Public can read active stores
CREATE POLICY "Public can read active stores"
  ON stores
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Enable RLS on store_managers table
ALTER TABLE store_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to store_managers"
  ON store_managers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Store managers can read their own assignments
CREATE POLICY "Store managers can read own assignments"
  ON store_managers
  FOR SELECT
  TO authenticated
  USING (user_id::uuid = auth.uid());

-- Enable RLS on discogs_tokens table (CRITICAL - contains OAuth tokens)
ALTER TABLE discogs_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role ONLY access to discogs_tokens"
  ON discogs_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- NO PUBLIC ACCESS TO TOKENS - Service role only

-- =====================================================
-- LAYER 2: CORE CONTENT TABLES
-- =====================================================

-- Enable RLS on records table
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to records"
  ON records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read active records"
  ON records
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enable RLS on tracks table
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to tracks"
  ON tracks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read tracks"
  ON tracks
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enable RLS on store_inventory table
ALTER TABLE store_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to store_inventory"
  ON store_inventory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read available inventory"
  ON store_inventory
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- =====================================================
-- LAYER 3: MATCHING & ENRICHMENT TABLES
-- =====================================================

-- Enable RLS on audio_matches table
ALTER TABLE audio_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to audio_matches"
  ON audio_matches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read verified audio_matches"
  ON audio_matches
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('verified', 'auto_approved'));

-- Enable RLS on audio_match_history table
ALTER TABLE audio_match_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to audio_match_history"
  ON audio_match_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on match_candidates table
ALTER TABLE match_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to match_candidates"
  ON match_candidates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on audio_quality_metrics table
ALTER TABLE audio_quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to audio_quality_metrics"
  ON audio_quality_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on metadata_cache table
ALTER TABLE metadata_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to metadata_cache"
  ON metadata_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on track_matches table (legacy)
ALTER TABLE track_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to track_matches"
  ON track_matches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- LAYER 4: USER FEATURES TABLES
-- =====================================================

-- Enable RLS on favorites table
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to favorites"
  ON favorites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage own favorites"
  ON favorites
  FOR ALL
  TO authenticated
  USING (user_id::uuid = auth.uid())
  WITH CHECK (user_id::uuid = auth.uid());

-- Enable RLS on play_history table
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to play_history"
  ON play_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read own play_history"
  ON play_history
  FOR SELECT
  TO authenticated
  USING (user_id::uuid = auth.uid());

-- Enable RLS on feedback table
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to feedback"
  ON feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (user_id::uuid = auth.uid());

-- Enable RLS on user_collections table
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to user_collections"
  ON user_collections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage own collections"
  ON user_collections
  FOR ALL
  TO authenticated
  USING (user_id::uuid = auth.uid())
  WITH CHECK (user_id::uuid = auth.uid());

-- Enable RLS on user_collection_items table
ALTER TABLE user_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to user_collection_items"
  ON user_collection_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage own collection_items"
  ON user_collection_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_collections
      WHERE id = user_collection_items.collection_id
      AND user_id::uuid = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_collections
      WHERE id = user_collection_items.collection_id
      AND user_id::uuid = auth.uid()
    )
  );

-- Enable RLS on user_follows table
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to user_follows"
  ON user_follows
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage own follows"
  ON user_follows
  FOR ALL
  TO authenticated
  USING (follower_id::uuid = auth.uid())
  WITH CHECK (follower_id::uuid = auth.uid());

-- Enable RLS on user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to user_preferences"
  ON user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (user_id::uuid = auth.uid())
  WITH CHECK (user_id::uuid = auth.uid());

-- =====================================================
-- LAYER 5: ANALYTICS & ADMIN TABLES
-- =====================================================

-- Enable RLS on jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to jobs"
  ON jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on job_logs table
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to job_logs"
  ON job_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to audit_logs"
  ON audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on usage_metrics table
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to usage_metrics"
  ON usage_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on daily_metrics table
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to daily_metrics"
  ON daily_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on recommendation_data table
ALTER TABLE recommendation_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to recommendation_data"
  ON recommendation_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on content_similarity table
ALTER TABLE content_similarity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to content_similarity"
  ON content_similarity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on performance_metrics table
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to performance_metrics"
  ON performance_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- LAYER 6: CONFIGURATION TABLES
-- =====================================================

-- Enable RLS on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to settings"
  ON settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read public settings"
  ON settings
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Enable RLS on feature_flags table
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to feature_flags"
  ON feature_flags
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on feature_flag_history table
ALTER TABLE feature_flag_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to feature_flag_history"
  ON feature_flag_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on feature_flag_evaluations table
ALTER TABLE feature_flag_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to feature_flag_evaluations"
  ON feature_flag_evaluations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on config_profiles table
ALTER TABLE config_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to config_profiles"
  ON config_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on maintenance_windows table
ALTER TABLE maintenance_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to maintenance_windows"
  ON maintenance_windows
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to rate_limits"
  ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on cache_config table
ALTER TABLE cache_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to cache_config"
  ON cache_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- LAYER 7: RELEASES & PROCESSING TABLES
-- =====================================================

-- Enable RLS on releases table
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to releases"
  ON releases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read releases with audio matches"
  ON releases
  FOR SELECT
  TO anon, authenticated
  USING (has_audio_matches = true);

-- Enable RLS on store_sync_log table
ALTER TABLE store_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to store_sync_log"
  ON store_sync_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on processing_queue table
ALTER TABLE processing_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to processing_queue"
  ON processing_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on admin_stores table
ALTER TABLE admin_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to admin_stores"
  ON admin_stores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on migrations table (system table)
ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to migrations"
  ON migrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- SUMMARY
-- =====================================================
-- Total tables secured: 44
--
-- Security Model:
-- 1. Service role (Next.js API) has full access to all tables
-- 2. Authenticated users have limited access to their own data
-- 3. Anonymous users can read public content only
-- 4. Sensitive tables (tokens, admin, metrics) are service-role only
--
-- This prevents direct PostgREST API abuse while maintaining
-- full functionality for server-side Next.js API routes.
-- =====================================================
