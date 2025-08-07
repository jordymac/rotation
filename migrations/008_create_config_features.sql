-- Migration: Create configuration and feature flags tables
-- Settings, feature flags, and system configuration

-- Create enum types for configuration
CREATE TYPE setting_type AS ENUM ('string', 'number', 'boolean', 'json', 'array');
CREATE TYPE feature_flag_type AS ENUM ('boolean', 'percentage', 'user_list', 'condition');

-- System settings and configuration
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    value_type setting_type DEFAULT 'string',
    category TEXT DEFAULT 'general', -- 'general', 'audio', 'ui', 'performance', 'security'
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Whether this setting can be read by frontend
    is_encrypted BOOLEAN DEFAULT false, -- Whether the value should be encrypted
    default_value TEXT,
    validation_rules JSONB DEFAULT '{}'::jsonb, -- JSON schema for validation
    last_modified_by INTEGER REFERENCES users(id),
    last_modified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags for gradual rollouts and A/B testing
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    flag_type feature_flag_type DEFAULT 'boolean',
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0, -- 0-100 for percentage rollouts
    target_users INTEGER[] DEFAULT '{}', -- Specific user IDs for user_list type
    conditions JSONB DEFAULT '{}'::jsonb, -- Complex conditions for conditional flags
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional flag configuration
    environment TEXT DEFAULT 'production', -- 'development', 'staging', 'production'
    created_by INTEGER REFERENCES users(id),
    last_modified_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flag history for tracking changes
CREATE TABLE IF NOT EXISTS feature_flag_history (
    id SERIAL PRIMARY KEY,
    feature_flag_id INTEGER NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'enabled', 'disabled', 'updated', 'deleted'
    old_value JSONB,
    new_value JSONB,
    rollout_percentage_old INTEGER,
    rollout_percentage_new INTEGER,
    changed_by INTEGER REFERENCES users(id),
    change_reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flag evaluations (for analytics)
CREATE TABLE IF NOT EXISTS feature_flag_evaluations (
    id SERIAL PRIMARY KEY,
    feature_flag_id INTEGER NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    session_id TEXT,
    evaluation_result BOOLEAN NOT NULL,
    evaluation_context JSONB DEFAULT '{}'::jsonb, -- User properties, request context, etc.
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application configuration profiles
CREATE TABLE IF NOT EXISTS config_profiles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    environment TEXT NOT NULL, -- 'development', 'staging', 'production'
    is_active BOOLEAN DEFAULT false,
    config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    schema_version TEXT DEFAULT '1.0',
    created_by INTEGER REFERENCES users(id),
    activated_by INTEGER REFERENCES users(id),
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API rate limiting configuration
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP, user ID, API key, etc.
    identifier_type TEXT NOT NULL, -- 'ip', 'user', 'api_key'
    endpoint_pattern TEXT NOT NULL, -- '/api/tracks/*', '/api/search'
    requests_per_window INTEGER NOT NULL,
    window_duration_seconds INTEGER NOT NULL,
    burst_allowance INTEGER DEFAULT 0, -- Allow bursts above the rate
    current_count INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT false,
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, identifier_type, endpoint_pattern)
);

-- Cache configuration and management
CREATE TABLE IF NOT EXISTS cache_config (
    id SERIAL PRIMARY KEY,
    cache_key_pattern TEXT NOT NULL UNIQUE, -- 'match:*', 'user:profile:*'
    ttl_seconds INTEGER NOT NULL,
    max_size_mb INTEGER, -- Maximum cache size for this pattern
    compression_enabled BOOLEAN DEFAULT false,
    cache_strategy TEXT DEFAULT 'lru', -- 'lru', 'lfu', 'ttl'
    invalidation_rules JSONB DEFAULT '[]'::jsonb, -- Rules for cache invalidation
    monitoring_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System maintenance windows
CREATE TABLE IF NOT EXISTS maintenance_windows (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    maintenance_type TEXT NOT NULL, -- 'database', 'api', 'full_system', 'feature'
    affected_services TEXT[] DEFAULT '{}',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_emergency BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    impact_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    notification_sent BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_is_public ON settings(is_public);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_target_users ON feature_flags USING GIN (target_users);

CREATE INDEX IF NOT EXISTS idx_feature_flag_history_flag_id ON feature_flag_history(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_history_changed_at ON feature_flag_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_feature_flag_history_changed_by ON feature_flag_history(changed_by);

CREATE INDEX IF NOT EXISTS idx_feature_flag_evaluations_flag_id ON feature_flag_evaluations(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_evaluations_user_id ON feature_flag_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_evaluations_evaluated_at ON feature_flag_evaluations(evaluated_at);

CREATE INDEX IF NOT EXISTS idx_config_profiles_environment ON config_profiles(environment);
CREATE INDEX IF NOT EXISTS idx_config_profiles_is_active ON config_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint_pattern ON rate_limits(endpoint_pattern);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_is_blocked ON rate_limits(is_blocked);

CREATE INDEX IF NOT EXISTS idx_cache_config_pattern ON cache_config(cache_key_pattern);

CREATE INDEX IF NOT EXISTS idx_maintenance_windows_starts_at ON maintenance_windows(starts_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_windows_status ON maintenance_windows(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_windows_impact_level ON maintenance_windows(impact_level);

-- Triggers for updated_at
CREATE TRIGGER update_feature_flags_updated_at 
    BEFORE UPDATE ON feature_flags 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_profiles_updated_at 
    BEFORE UPDATE ON config_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON rate_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_config_updated_at 
    BEFORE UPDATE ON cache_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_windows_updated_at 
    BEFORE UPDATE ON maintenance_windows 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log feature flag changes
CREATE OR REPLACE FUNCTION log_feature_flag_change() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO feature_flag_history (feature_flag_id, action, new_value, rollout_percentage_new, changed_by)
        VALUES (NEW.id, 'created', row_to_json(NEW), NEW.rollout_percentage, NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO feature_flag_history (
            feature_flag_id, action, old_value, new_value,
            rollout_percentage_old, rollout_percentage_new, changed_by
        )
        VALUES (
            NEW.id, 'updated', row_to_json(OLD), row_to_json(NEW),
            OLD.rollout_percentage, NEW.rollout_percentage, NEW.last_modified_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO feature_flag_history (feature_flag_id, action, old_value, changed_by)
        VALUES (OLD.id, 'deleted', row_to_json(OLD), OLD.last_modified_by);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for feature flag history
CREATE TRIGGER feature_flag_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION log_feature_flag_change();

-- Function to evaluate feature flags
CREATE OR REPLACE FUNCTION evaluate_feature_flag(
    flag_key TEXT,
    user_id_param INTEGER DEFAULT NULL,
    context_param JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN AS $$
DECLARE
    flag_record feature_flags%ROWTYPE;
    result BOOLEAN := false;
    random_value INTEGER;
BEGIN
    -- Get the feature flag
    SELECT * INTO flag_record 
    FROM feature_flags 
    WHERE key = flag_key AND is_enabled = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Evaluate based on flag type
    CASE flag_record.flag_type
        WHEN 'boolean' THEN
            result := flag_record.is_enabled;
            
        WHEN 'percentage' THEN
            -- Use consistent random value based on user ID or session
            random_value := abs(hashtext(COALESCE(user_id_param::text, 'anonymous'))) % 100;
            result := random_value < flag_record.rollout_percentage;
            
        WHEN 'user_list' THEN
            result := user_id_param = ANY(flag_record.target_users);
            
        WHEN 'condition' THEN
            -- Complex condition evaluation would go here
            -- For now, just return the basic enabled state
            result := flag_record.is_enabled;
    END CASE;
    
    -- Log the evaluation
    INSERT INTO feature_flag_evaluations (
        feature_flag_id, user_id, evaluation_result, evaluation_context
    ) VALUES (
        flag_record.id, user_id_param, result, context_param
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert default settings
INSERT INTO settings (key, value, value_type, category, description, is_public, default_value) VALUES
    ('app.name', 'Rotation', 'string', 'general', 'Application name', true, 'Rotation'),
    ('app.version', '1.0.0', 'string', 'general', 'Application version', true, '1.0.0'),
    ('feed.default_batch_size', '20', 'number', 'ui', 'Default number of items to load in feed', true, '20'),
    ('feed.max_batch_size', '100', 'number', 'ui', 'Maximum number of items that can be requested at once', false, '100'),
    ('audio.match_confidence_threshold', '0.8', 'number', 'audio', 'Minimum confidence score for auto-approving matches', false, '0.8'),
    ('audio.preferred_platforms', '["youtube", "soundcloud"]', 'json', 'audio', 'Preferred audio platforms in order', true, '["youtube", "soundcloud"]'),
    ('cache.default_ttl_seconds', '3600', 'number', 'performance', 'Default cache TTL in seconds', false, '3600'),
    ('rate_limit.default_requests_per_minute', '60', 'number', 'security', 'Default API rate limit per minute', false, '60'),
    ('maintenance.enabled', 'false', 'boolean', 'general', 'Whether the site is in maintenance mode', true, 'false')
ON CONFLICT (key) DO NOTHING;

-- Insert default feature flags
INSERT INTO feature_flags (key, name, description, flag_type, is_enabled, rollout_percentage, environment) VALUES
    ('audio_matching_v2', 'Audio Matching V2', 'Enable improved audio matching algorithm', 'percentage', false, 0, 'production'),
    ('collaborative_playlists', 'Collaborative Playlists', 'Allow users to create collaborative playlists', 'boolean', false, 0, 'production'),
    ('soundcloud_integration', 'SoundCloud Integration', 'Enable SoundCloud as an audio source', 'boolean', true, 100, 'production'),
    ('advanced_search', 'Advanced Search', 'Enable advanced search filters', 'percentage', true, 50, 'production'),
    ('beta_features', 'Beta Features', 'Enable beta features for specific users', 'user_list', false, 0, 'production')
ON CONFLICT (key) DO NOTHING;

-- Comments
COMMENT ON TABLE settings IS 'System configuration settings and parameters';
COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollouts and A/B testing';
COMMENT ON TABLE feature_flag_history IS 'Audit trail for feature flag changes';
COMMENT ON TABLE feature_flag_evaluations IS 'Log of feature flag evaluations for analytics';
COMMENT ON TABLE config_profiles IS 'Environment-specific configuration profiles';
COMMENT ON TABLE rate_limits IS 'API rate limiting configuration and state';
COMMENT ON TABLE cache_config IS 'Cache configuration and management rules';
COMMENT ON TABLE maintenance_windows IS 'Scheduled maintenance windows and notifications';

COMMENT ON COLUMN settings.is_public IS 'Whether this setting can be read by frontend applications';
COMMENT ON COLUMN settings.is_encrypted IS 'Whether the value should be stored encrypted';
COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of users who see this feature (0-100)';
COMMENT ON COLUMN feature_flags.target_users IS 'Specific user IDs for user_list type flags';
COMMENT ON COLUMN rate_limits.burst_allowance IS 'Allow requests above the rate limit for short bursts';
COMMENT ON COLUMN cache_config.invalidation_rules IS 'JSON rules for when to invalidate cache entries';