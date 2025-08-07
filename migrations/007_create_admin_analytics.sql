-- Migration: Create admin and analytics tables
-- Upload jobs, audit trails, usage metrics, and recommendation data

-- Create enum types for jobs and analytics
CREATE TYPE job_type AS ENUM ('store_sync', 'audio_matching', 'metadata_refresh', 'image_processing', 'backup', 'cleanup', 'migration');
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled', 'retrying');
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warning', 'error', 'critical');

-- Upload/background jobs tracking
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    type job_type NOT NULL,
    status job_status DEFAULT 'pending',
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    current_step TEXT,
    total_steps INTEGER,
    completed_steps INTEGER DEFAULT 0,
    parameters JSONB DEFAULT '{}'::jsonb, -- Job configuration and inputs
    result JSONB DEFAULT '{}'::jsonb, -- Job output and results
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_completion_at TIMESTAMPTZ,
    initiated_by INTEGER REFERENCES users(id),
    assigned_to TEXT, -- Worker/server handling the job
    parent_job_id INTEGER REFERENCES jobs(id), -- For sub-jobs
    depends_on_job_id INTEGER REFERENCES jobs(id), -- Job dependencies
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detailed job logs
CREATE TABLE IF NOT EXISTS job_logs (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    level log_level NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    step_name TEXT,
    execution_time_ms INTEGER,
    memory_usage_mb INTEGER,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- System audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject'
    entity_type TEXT NOT NULL, -- 'user', 'store', 'record', 'audio_match', etc.
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}'::jsonb, -- IP, user agent, etc.
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage metrics and analytics
CREATE TABLE IF NOT EXISTS usage_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id), -- NULL for anonymous users
    session_id TEXT,
    event_type TEXT NOT NULL, -- 'page_view', 'track_play', 'search', 'click', 'scroll'
    event_name TEXT NOT NULL, -- Specific event like 'play_track', 'add_favorite'
    entity_type TEXT, -- What was interacted with
    entity_id INTEGER,
    properties JSONB DEFAULT '{}'::jsonb, -- Event-specific data
    user_agent TEXT,
    ip_address INET,
    country_code TEXT,
    city TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    referrer_url TEXT,
    page_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Daily aggregated metrics for performance
CREATE TABLE IF NOT EXISTS daily_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    metric_type TEXT NOT NULL, -- 'user_activity', 'track_plays', 'store_views', etc.
    entity_type TEXT, -- 'user', 'store', 'track', 'record', 'global'
    entity_id INTEGER, -- NULL for global metrics
    metric_name TEXT NOT NULL, -- 'total_plays', 'unique_users', 'session_duration'
    metric_value DECIMAL(15,2) NOT NULL,
    additional_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(metric_date, metric_type, entity_type, entity_id, metric_name)
);

-- Recommendation data and user preferences
CREATE TABLE IF NOT EXISTS recommendation_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL, -- 'genre_preference', 'artist_affinity', 'listening_pattern'
    data_key TEXT NOT NULL, -- 'electronic_score', 'jazz_score', 'morning_listener'
    data_value DECIMAL(10,6) NOT NULL, -- Numeric weight/score
    confidence DECIMAL(5,4) DEFAULT 1.0000, -- How confident we are in this data
    evidence_count INTEGER DEFAULT 1, -- How many data points support this
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- When this data should be recalculated
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, recommendation_type, data_key)
);

-- Content similarity matrix for recommendations
CREATE TABLE IF NOT EXISTS content_similarity (
    id SERIAL PRIMARY KEY,
    source_type TEXT NOT NULL, -- 'track', 'record', 'artist'
    source_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    similarity_score DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    similarity_type TEXT NOT NULL, -- 'audio_features', 'collaborative', 'metadata'
    calculation_method TEXT, -- Algorithm used to calculate similarity
    confidence DECIMAL(5,4) DEFAULT 1.0000,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    UNIQUE(source_type, source_id, target_type, target_id, similarity_type)
);

-- Performance monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_type TEXT NOT NULL, -- 'api_response_time', 'cache_hit_rate', 'db_query_time'
    endpoint TEXT, -- API endpoint or function name
    operation TEXT, -- Specific operation being measured
    duration_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_initiated_by ON jobs(initiated_by);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_at ON jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_parent_job_id ON jobs(parent_job_id);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_level ON job_logs(level);
CREATE INDEX IF NOT EXISTS idx_job_logs_logged_at ON job_logs(logged_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_id ON usage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_event_type ON usage_metrics(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_entity ON usage_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_timestamp ON usage_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_session_id ON usage_metrics(session_id);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_type ON daily_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_entity ON daily_metrics(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_data_user_id ON recommendation_data(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_data_type ON recommendation_data(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendation_data_expires_at ON recommendation_data(expires_at);

CREATE INDEX IF NOT EXISTS idx_content_similarity_source ON content_similarity(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_content_similarity_target ON content_similarity(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_similarity_score ON content_similarity(similarity_score);
CREATE INDEX IF NOT EXISTS idx_content_similarity_expires_at ON content_similarity(expires_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_measured_at ON performance_metrics(measured_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_status_type_priority ON jobs(status, type, priority);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_timestamp ON usage_metrics(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date_type ON daily_metrics(metric_date, metric_type);

-- Triggers for updated_at
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day') RETURNS void AS $$
BEGIN
    -- Aggregate track plays
    INSERT INTO daily_metrics (metric_date, metric_type, entity_type, metric_name, metric_value)
    SELECT 
        target_date,
        'track_activity',
        'track',
        'total_plays',
        COUNT(*)
    FROM play_history 
    WHERE DATE(played_at) = target_date 
      AND action = 'play'
    GROUP BY track_id
    ON CONFLICT (metric_date, metric_type, entity_type, entity_id, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value;
    
    -- Aggregate user activity
    INSERT INTO daily_metrics (metric_date, metric_type, entity_type, metric_name, metric_value)
    SELECT 
        target_date,
        'user_activity',
        'global',
        'unique_active_users',
        COUNT(DISTINCT user_id)
    FROM usage_metrics 
    WHERE DATE(timestamp) = target_date 
      AND user_id IS NOT NULL
    ON CONFLICT (metric_date, metric_type, entity_type, entity_id, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value;
    
    -- Add more aggregations as needed
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data() RETURNS void AS $$
BEGIN
    -- Clean up old job logs (keep 30 days)
    DELETE FROM job_logs WHERE logged_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old usage metrics (keep 90 days of raw data)
    DELETE FROM usage_metrics WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Clean up old performance metrics (keep 7 days)
    DELETE FROM performance_metrics WHERE measured_at < NOW() - INTERVAL '7 days';
    
    -- Clean up expired similarity data
    DELETE FROM content_similarity WHERE expires_at < NOW();
    
    -- Clean up expired recommendation data
    DELETE FROM recommendation_data WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE jobs IS 'Background jobs and long-running tasks with progress tracking';
COMMENT ON TABLE job_logs IS 'Detailed logs for job execution and debugging';
COMMENT ON TABLE audit_logs IS 'System audit trail for compliance and debugging';
COMMENT ON TABLE usage_metrics IS 'Raw user interaction and behavior tracking';
COMMENT ON TABLE daily_metrics IS 'Aggregated daily metrics for performance and analytics';
COMMENT ON TABLE recommendation_data IS 'User preference data for personalized recommendations';
COMMENT ON TABLE content_similarity IS 'Content similarity matrix for recommendation algorithms';
COMMENT ON TABLE performance_metrics IS 'System performance monitoring and optimization data';

COMMENT ON COLUMN jobs.priority IS '1 = highest priority, 10 = lowest priority';
COMMENT ON COLUMN jobs.parameters IS 'JSON configuration and input parameters for the job';
COMMENT ON COLUMN jobs.result IS 'JSON output and results from completed job';
COMMENT ON COLUMN recommendation_data.confidence IS 'Confidence level in this recommendation data (0.0000 to 1.0000)';
COMMENT ON COLUMN content_similarity.similarity_score IS 'Similarity score between content items (0.0000 to 1.0000)';
COMMENT ON COLUMN daily_metrics.metric_value IS 'Aggregated metric value for the specific date and entity';