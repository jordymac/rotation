-- =====================================================
-- Migration: 014_fix_function_search_path.sql
-- Description: Fix search_path for database functions
-- Date: 2025-10-28
-- Security Level: WARNING
-- =====================================================
--
-- This migration addresses Supabase database linter warnings:
-- - function_search_path_mutable (WARN level)
--
-- Issue: Functions without explicit search_path can be vulnerable
-- to schema injection attacks if malicious schemas are created.
--
-- Solution: Add "SET search_path = public, pg_temp" to all functions
-- =====================================================

-- =====================================================
-- TOKEN ENCRYPTION FUNCTIONS
-- =====================================================

-- Fix encrypt_token function
CREATE OR REPLACE FUNCTION encrypt_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN encode(encrypt(token::bytea, 'your-secret-key'::bytea, 'aes'), 'base64');
END;
$$;

-- Fix decrypt_token function
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN convert_from(decrypt(decode(encrypted_token, 'base64'), 'your-secret-key'::bytea, 'aes'), 'UTF8');
END;
$$;

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Fix cleanup_expired_candidates function
CREATE OR REPLACE FUNCTION cleanup_expired_candidates()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM match_candidates
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Fix cleanup_old_analytics_data function
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Delete usage metrics older than 90 days
  DELETE FROM usage_metrics
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Delete audit logs older than 1 year
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';

  -- Delete old play history (keep 6 months)
  DELETE FROM play_history
  WHERE played_at < NOW() - INTERVAL '180 days';
END;
$$;

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Fix update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix log_audio_match_change trigger function
CREATE OR REPLACE FUNCTION log_audio_match_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO audio_match_history (
    audio_match_id,
    change_type,
    old_status,
    new_status,
    old_confidence,
    new_confidence,
    changed_by,
    change_reason
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    OLD.status,
    NEW.status,
    OLD.confidence_score,
    NEW.confidence_score,
    COALESCE(NEW.verified_by, OLD.verified_by),
    NULL
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix update_collection_stats trigger function
CREATE OR REPLACE FUNCTION update_collection_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update track count for the collection
  UPDATE user_collections
  SET
    track_count = (
      SELECT COUNT(*)
      FROM user_collection_items
      WHERE collection_id = COALESCE(NEW.collection_id, OLD.collection_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.collection_id, OLD.collection_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix log_feature_flag_change trigger function
CREATE OR REPLACE FUNCTION log_feature_flag_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO feature_flag_history (
    feature_flag_id,
    change_type,
    old_value,
    new_value,
    changed_by
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    row_to_json(OLD),
    row_to_json(NEW),
    NULL
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Fix aggregate_daily_metrics function
CREATE OR REPLACE FUNCTION aggregate_daily_metrics()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  target_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Aggregate usage metrics
  INSERT INTO daily_metrics (
    metric_date,
    metric_type,
    entity_type,
    entity_id,
    metric_name,
    metric_value
  )
  SELECT
    target_date,
    'usage',
    'platform',
    0,
    'total_events',
    COUNT(*)
  FROM usage_metrics
  WHERE created_at::date = target_date
  ON CONFLICT (metric_date, metric_type, entity_type, entity_id, metric_name)
  DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    updated_at = NOW();

  -- Aggregate play metrics
  INSERT INTO daily_metrics (
    metric_date,
    metric_type,
    entity_type,
    entity_id,
    metric_name,
    metric_value
  )
  SELECT
    target_date,
    'engagement',
    'platform',
    0,
    'total_plays',
    COUNT(*)
  FROM play_history
  WHERE played_at::date = target_date
  ON CONFLICT (metric_date, metric_type, entity_type, entity_id, metric_name)
  DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    updated_at = NOW();
END;
$$;

-- =====================================================
-- FEATURE FLAG FUNCTIONS
-- =====================================================

-- Fix evaluate_feature_flag function
CREATE OR REPLACE FUNCTION evaluate_feature_flag(
  flag_key TEXT,
  user_id_param INTEGER DEFAULT NULL,
  context_param JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  flag_record RECORD;
  result BOOLEAN := false;
  random_value NUMERIC;
BEGIN
  -- Get the feature flag
  SELECT * INTO flag_record
  FROM feature_flags
  WHERE key = flag_key AND enabled = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Evaluate based on flag type
  CASE flag_record.flag_type
    WHEN 'boolean' THEN
      result := true;

    WHEN 'percentage' THEN
      random_value := random();
      result := random_value < (flag_record.rollout_percentage / 100.0);

    WHEN 'user_list' THEN
      IF user_id_param IS NOT NULL THEN
        result := flag_record.target_users @> jsonb_build_array(user_id_param);
      END IF;

    WHEN 'condition' THEN
      -- Simple condition evaluation (extend as needed)
      result := true;

    ELSE
      result := false;
  END CASE;

  -- Log evaluation
  INSERT INTO feature_flag_evaluations (
    feature_flag_id,
    user_id,
    context,
    result
  ) VALUES (
    flag_record.id,
    user_id_param,
    context_param,
    result
  );

  RETURN result;
END;
$$;

-- =====================================================
-- STORE SYNC FUNCTIONS
-- =====================================================

-- Fix update_sync_stats function
CREATE OR REPLACE FUNCTION update_sync_stats(
  store_username_param TEXT,
  listings_processed_param INTEGER DEFAULT 0,
  new_releases_param INTEGER DEFAULT 0,
  cached_served_param INTEGER DEFAULT 0,
  audio_matches_param INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO store_sync_log (
    store_username,
    listings_processed,
    new_releases_found,
    cached_releases_served,
    audio_matches_created
  ) VALUES (
    store_username_param,
    listings_processed_param,
    new_releases_param,
    cached_served_param,
    audio_matches_param
  )
  ON CONFLICT (store_username)
  DO UPDATE SET
    listings_processed = store_sync_log.listings_processed + EXCLUDED.listings_processed,
    new_releases_found = store_sync_log.new_releases_found + EXCLUDED.new_releases_found,
    cached_releases_served = store_sync_log.cached_releases_served + EXCLUDED.cached_releases_served,
    audio_matches_created = store_sync_log.audio_matches_created + EXCLUDED.audio_matches_created,
    last_sync = NOW();
END;
$$;

-- Fix get_cached_releases function
CREATE OR REPLACE FUNCTION get_cached_releases(store_username_param TEXT)
RETURNS TABLE (
  discogs_id INTEGER,
  title TEXT,
  artist TEXT,
  year INTEGER,
  label TEXT,
  catno TEXT,
  thumb TEXT,
  genres JSONB,
  styles JSONB,
  tracklist JSONB,
  images JSONB,
  discogs_uri TEXT,
  price_value TEXT,
  price_currency TEXT,
  condition TEXT,
  sleeve_condition TEXT,
  comments TEXT,
  audio_match_count INTEGER,
  last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.discogs_id,
    r.title,
    r.artist,
    r.year,
    r.label,
    r.catno,
    r.thumb,
    r.genres,
    r.styles,
    r.tracklist,
    r.images,
    r.discogs_uri,
    r.price_value,
    r.price_currency,
    r.condition,
    r.sleeve_condition,
    r.comments,
    r.audio_match_count,
    r.last_updated
  FROM releases r
  WHERE r.store_username = store_username_param
    AND r.has_audio_matches = true
  ORDER BY r.last_updated DESC;
END;
$$;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Total functions fixed: 12
--
-- Security Improvement:
-- All functions now have explicit search_path set to "public, pg_temp"
-- This prevents schema injection attacks by ensuring functions only
-- access objects in the public schema or temporary tables.
--
-- pg_temp allows temporary table access while maintaining security.
-- =====================================================
