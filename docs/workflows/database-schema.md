# Rotation Database Schema Documentation

This document describes the complete database architecture for the Rotation vinyl discovery platform. The database is designed to power all dynamic features from basic content management to advanced user personalization and analytics.

## Architecture Overview

The database is organized into 7 logical layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURATION LAYER                      │
│  Settings • Feature Flags • Rate Limits • Cache Config     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     ANALYTICS LAYER                        │
│  Jobs • Audit Logs • Usage Metrics • Recommendations       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   USER FEATURES LAYER                      │
│  Favorites • Play History • Feedback • Collections         │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 MATCHING & ENRICHMENT LAYER                │
│  Audio Matches • Metadata Cache • Quality Metrics          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┘
│                    CORE CONTENT LAYER                      │
│  Records • Tracks • Store Inventory • Collections          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┘
│                    IDENTITY LAYER                          │
│  Users • Stores • Store Managers • Tokens                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┘
│                     CACHING LAYER                          │
│  Redis Cache • Track Matches • Metadata Cache              │
└─────────────────────────────────────────────────────────────┘
```

## Database Tables

### Core Identity (Layer 1)

#### `users`
User accounts with authentication and profile information.
- **Primary Key**: `id` (serial)
- **Key Fields**: `email` (unique), `username` (unique), `role`
- **Indexes**: email, username, role, is_active
- **Enums**: `user_role` (admin, store_manager, general_user)

#### `stores`
Record stores with Discogs integration and business information.
- **Primary Key**: `id` (serial)
- **Key Fields**: `slug` (unique), `discogs_username` (unique)
- **Indexes**: slug, discogs_username, status, owner_user_id
- **Enums**: `store_status` (active, pending, suspended, inactive)

#### `store_managers`
Many-to-many relationship for store management permissions.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `store_id` → stores, `user_id` → users
- **Unique**: (store_id, user_id)

#### `discogs_tokens`
Encrypted Discogs OAuth tokens for users.
- **Primary Key**: `id` (serial)
- **Key Fields**: `username` (unique)
- **Features**: Token encryption with pgcrypto

### Core Content (Layer 2)

#### `records`
Catalog releases from Discogs with complete metadata.
- **Primary Key**: `id` (serial)
- **Key Fields**: `discogs_release_id` (unique), `artist`, `title`
- **Indexes**: discogs_release_id, artist, artist_sort, release_year, genres (GIN)
- **Features**: JSONB for images/videos, array fields for genres/styles

#### `store_inventory`
Individual store inventory items - specific copies for sale.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `store_id` → stores, `record_id` → records
- **Key Fields**: `discogs_listing_id` (unique)
- **Enums**: `record_condition`, `sleeve_condition`

#### `tracks`
Individual tracks within records with metadata.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `record_id` → records
- **Key Fields**: `position`, `track_index`
- **Features**: JSONB for artists/credits, array fields for tags

### Matching & Enrichment (Layer 3)

#### `audio_matches`
Enhanced audio matches with platform-specific metadata.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `track_id` → tracks, `verified_by` → users
- **Key Fields**: `platform`, `external_id`, `confidence_score`
- **Enums**: `match_status`, `audio_platform`
- **Features**: Quality scoring, popularity metrics

#### `metadata_cache`
Cache for heavy-to-fetch metadata (YouTube descriptions, etc.).
- **Primary Key**: `id` (serial)
- **Key Fields**: `entity_type`, `entity_id`, `cache_key`
- **Features**: TTL expiration, refresh tracking

#### `audio_match_history`
Audit trail for audio match changes and verifications.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `audio_match_id` → audio_matches

#### `match_candidates`
Temporary storage for match candidates during processing.
- **Primary Key**: `id` (serial)
- **Features**: Automatic expiration (1 hour TTL)

#### `audio_quality_metrics`
Detailed audio quality analysis for matches.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `audio_match_id` → audio_matches
- **Features**: Bitrate, dynamic range, loudness analysis

### User Features (Layer 4)

#### `favorites`
User bookmarks for tracks, records, stores, and audio matches.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `user_id` → users
- **Key Fields**: `favoritable_type`, `favoritable_id`
- **Unique**: (user_id, favoritable_type, favoritable_id)

#### `play_history`
Detailed listening history and behavior analytics.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `user_id` → users, `track_id` → tracks
- **Features**: Session tracking, completion percentage, device info

#### `feedback`
User-reported issues and suggestions for improvement.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `user_id` → users, `assigned_to` → users
- **Enums**: `feedback_type`, `feedback_status`

#### `user_collections`
User-created playlists and track collections.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `user_id` → users

#### `user_collection_items`
Tracks within user collections with ordering.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `collection_id` → user_collections, `track_id` → tracks

#### `user_follows`
User follows for stores and other users.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `follower_id` → users

#### `user_preferences`
User settings and personalization preferences.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `user_id` → users (unique)

### Analytics & Admin (Layer 5)

#### `jobs`
Background jobs and long-running tasks with progress tracking.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `initiated_by` → users
- **Enums**: `job_type`, `job_status`
- **Features**: Progress tracking, retry logic, dependencies

#### `job_logs`
Detailed logs for job execution and debugging.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `job_id` → jobs
- **Enums**: `log_level`

#### `audit_logs`
System audit trail for compliance and debugging.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `user_id` → users
- **Features**: Old/new value tracking

#### `usage_metrics`
Raw user interaction and behavior tracking.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `user_id` → users
- **Features**: Session tracking, device fingerprinting

#### `daily_metrics`
Aggregated daily metrics for performance and analytics.
- **Primary Key**: `id` (serial)
- **Unique**: (metric_date, metric_type, entity_type, entity_id, metric_name)

#### `recommendation_data`
User preference data for personalized recommendations.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `user_id` → users
- **Features**: Confidence scoring, automatic expiration

#### `content_similarity`
Content similarity matrix for recommendation algorithms.
- **Primary Key**: `id` (serial)
- **Unique**: (source_type, source_id, target_type, target_id, similarity_type)

#### `performance_metrics`
System performance monitoring and optimization data.
- **Primary Key**: `id` (serial)
- **Features**: API response times, error tracking

### Configuration (Layer 6)

#### `settings`
System configuration settings and parameters.
- **Primary Key**: `id` (serial)
- **Key Fields**: `key` (unique)
- **Enums**: `setting_type`
- **Features**: Public/private settings, encryption support

#### `feature_flags`
Feature flags for gradual rollouts and A/B testing.
- **Primary Key**: `id` (serial)
- **Key Fields**: `key` (unique)
- **Enums**: `feature_flag_type`
- **Features**: Percentage rollouts, user targeting

#### `feature_flag_history`
Audit trail for feature flag changes.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `feature_flag_id` → feature_flags

#### `feature_flag_evaluations`
Log of feature flag evaluations for analytics.
- **Primary Key**: `id` (serial)
- **Foreign Keys**: `feature_flag_id` → feature_flags

#### `config_profiles`
Environment-specific configuration profiles.
- **Primary Key**: `id` (serial)
- **Key Fields**: `name` (unique)

#### `rate_limits`
API rate limiting configuration and state.
- **Primary Key**: `id` (serial)
- **Unique**: (identifier, identifier_type, endpoint_pattern)

#### `cache_config`
Cache configuration and management rules.
- **Primary Key**: `id` (serial)
- **Key Fields**: `cache_key_pattern` (unique)

#### `maintenance_windows`
Scheduled maintenance windows and notifications.
- **Primary Key**: `id` (serial)

### Legacy Tables (Layer 7)

#### `track_matches`
Original simple track matching table (maintained for backward compatibility).
- **Status**: Deprecated, use `audio_matches` instead

## Data Types and Enums

### User & Store Enums
```sql
user_role: 'admin' | 'store_manager' | 'general_user'
store_status: 'active' | 'pending' | 'suspended' | 'inactive'
```

### Content Enums
```sql
record_status: 'active' | 'sold' | 'reserved' | 'draft' | 'removed'
record_condition: 'Mint (M)' | 'Near Mint (NM or M-)' | ...
sleeve_condition: 'Mint (M)' | 'Near Mint (NM or M-)' | ...
```

### Audio Matching Enums
```sql
match_status: 'unverified' | 'verified' | 'needs_review' | 'rejected' | 'auto_approved'
audio_platform: 'youtube' | 'soundcloud' | 'spotify' | 'bandcamp' | 'discogs'
```

### User Features Enums
```sql
feedback_type: 'bad_match' | 'missing_audio' | 'wrong_metadata' | ...
feedback_status: 'open' | 'in_review' | 'resolved' | 'dismissed'
play_action: 'play' | 'pause' | 'skip' | 'complete' | 'seek'
```

### System Enums
```sql
job_type: 'store_sync' | 'audio_matching' | 'metadata_refresh' | ...
job_status: 'pending' | 'running' | 'completed' | 'failed' | ...
log_level: 'debug' | 'info' | 'warning' | 'error' | 'critical'
setting_type: 'string' | 'number' | 'boolean' | 'json' | 'array'
feature_flag_type: 'boolean' | 'percentage' | 'user_list' | 'condition'
```

## Key Features

### Performance Optimizations
- **Composite Indexes**: For common query patterns
- **GIN Indexes**: For array and JSONB columns
- **Partitioning**: Ready for time-based partitioning on large tables
- **Connection Pooling**: via pg-promise

### Data Integrity
- **Foreign Key Constraints**: Proper referential integrity
- **Unique Constraints**: Prevent duplicate data
- **Check Constraints**: Data validation at database level
- **Triggers**: Automatic timestamp updates, audit logging

### Caching Strategy
- **Redis Layer**: 24-hour TTL for hot data
- **Metadata Cache Table**: Long-term caching for expensive operations
- **Database-level Caching**: Query result caching

### Audit & Compliance
- **Audit Logs**: Complete change tracking
- **User Action Logging**: GDPR compliance ready
- **Data Retention**: Configurable cleanup policies

### Security Features
- **Token Encryption**: Sensitive data encrypted at rest
- **Rate Limiting**: API abuse prevention
- **Permission System**: Role-based access control

## Database Functions

### Utility Functions
```sql
update_updated_at_column() -- Auto-update timestamps
cleanup_expired_candidates() -- Clean temporary data
aggregate_daily_metrics() -- Generate analytics
cleanup_old_analytics_data() -- Data retention
```

### Feature Flag Functions
```sql
evaluate_feature_flag(key, user_id, context) -- Evaluate flags
log_feature_flag_change() -- Audit flag changes
```

### Triggers
- **Updated At**: Automatic timestamp updates
- **Audit Logging**: Change tracking
- **Collection Stats**: Maintain aggregate counts
- **History Logging**: Track important changes

## Indexes Summary

### Critical Performance Indexes
```sql
-- User lookups
idx_users_email, idx_users_username

-- Store lookups  
idx_stores_slug, idx_stores_discogs_username

-- Content searches
idx_records_artist, idx_records_genres (GIN)
idx_tracks_record_position

-- Audio matching
idx_audio_matches_track_platform_status
idx_audio_matches_status_confidence

-- User activity
idx_play_history_user_played_at
idx_favorites_user_type

-- Analytics
idx_usage_metrics_user_timestamp
idx_daily_metrics_date_type
```

## Migration Strategy

Migrations are applied in order:
1. `001_create_track_matches.sql` - Legacy caching system
2. `002_create_discogs_tokens.sql` - Token storage
3. `003_create_users_stores.sql` - Core identity
4. `004_create_records_tracks.sql` - Content entities
5. `005_create_audio_metadata.sql` - Enhanced matching
6. `006_create_user_features.sql` - User interactions
7. `007_create_admin_analytics.sql` - System management
8. `008_create_config_features.sql` - Configuration

## Monitoring & Maintenance

### Health Checks
- Connection pool status
- Query performance monitoring
- Index usage statistics
- Cache hit rates

### Maintenance Tasks
- Daily metrics aggregation
- Expired data cleanup
- Index maintenance
- Connection pool optimization

### Backup Strategy
- Full daily backups
- Transaction log backups
- Point-in-time recovery
- Cross-region replication

## API Integration

The database layer integrates with:
- **REST APIs**: Full CRUD operations
- **GraphQL**: Efficient data fetching
- **Real-time**: WebSocket subscriptions
- **Background Jobs**: Queue processing
- **Analytics**: Data pipelines

## Scalability Considerations

### Horizontal Scaling
- Read replicas for analytics queries
- Partitioning for large tables
- Connection pooling and load balancing

### Vertical Scaling
- Memory optimization for caching
- SSD storage for performance
- CPU optimization for complex queries

### Future Enhancements
- Time-series data for metrics
- Full-text search integration
- ML feature storage
- Graph database for recommendations

## Security

### Row Level Security (RLS)

**Implementation Date**: 2025-10-28
**Migration**: `013_enable_rls.sql`
**Status**: ✅ Enabled on all 44 tables

The database uses PostgreSQL Row Level Security to enforce access control at the database level, providing defense-in-depth even if application logic is bypassed.

#### Security Model

**Three-Tier Access Control**:

1. **Service Role (Backend API)**
   - Used by: Next.js API routes with `SUPABASE_SERVICE_ROLE_KEY`
   - Access Level: Full unrestricted access to all tables
   - Security: Key never exposed to client, server-side only
   - Use Cases: Admin operations, background jobs, data processing

2. **Authenticated Users**
   - Used by: Logged-in users via Clerk authentication
   - Access Level: Read/write own data, read public content
   - Security: JWT-based authentication with `auth.uid()` verification
   - Use Cases: User profile management, favorites, collections

3. **Anonymous Users**
   - Used by: Public visitors without authentication
   - Access Level: Read-only access to public content
   - Security: No write permissions, limited to approved content
   - Use Cases: Browsing stores, viewing releases, music discovery

#### Policy Summary by Layer

**Identity Layer (4 tables)**:
- `users`: Users read own data, service role manages all
- `stores`: Public can read active stores only
- `store_managers`: Managers read own assignments
- `discogs_tokens`: ⚠️ **SERVICE ROLE ONLY** - contains OAuth secrets

**Content Layer (4 tables)**:
- `records`, `tracks`, `store_inventory`: Public read access
- Service role manages all content creation/updates

**Matching Layer (6 tables)**:
- `audio_matches`: Public can read verified matches only
- `audio_match_history`, `match_candidates`: Service role only
- `audio_quality_metrics`, `metadata_cache`: Service role only

**User Features Layer (8 tables)**:
- Users have full control over their own data
- `favorites`, `user_collections`: Users manage own items
- `play_history`: Read-only for users, service role logs plays
- `feedback`: Users read own feedback

**Analytics Layer (9 tables)**:
- All analytics tables are service role only
- Contains sensitive metrics and user behavior data
- No public or user access

**Configuration Layer (9 tables)**:
- `settings`: Public can read `is_public = true` settings only
- All other config tables service role only
- Protects API keys and internal configuration

**Processing Layer (4 tables)**:
- `releases`: Public can read releases with audio matches
- `processing_queue`, `store_sync_log`: Service role only
- `admin_stores`: Service role only

#### Critical Security Tables

Tables with heightened security requirements:

1. **`discogs_tokens`** - OAuth credentials (service role only)
2. **`users`** - User data with PII
3. **`audit_logs`** - Security audit trail
4. **`usage_metrics`** - User behavior tracking
5. **`rate_limits`** - Security configuration

#### Testing RLS Policies

**Verify RLS Status**:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**List All Policies**:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Function Security

**Implementation Date**: 2025-10-28
**Migration**: `014_fix_function_search_path.sql`
**Status**: ✅ Fixed 12 functions

All database functions now explicitly set `search_path = public, pg_temp` to prevent schema injection attacks.

**Protected Functions**:
- Token encryption: `encrypt_token`, `decrypt_token`
- Cleanup: `cleanup_expired_candidates`, `cleanup_old_analytics_data`
- Triggers: `update_updated_at_column`, `log_audio_match_change`, etc.
- Analytics: `aggregate_daily_metrics`
- Store sync: `update_sync_stats`, `get_cached_releases`

### Encryption

**Token Encryption**:
- OAuth tokens encrypted at rest using pgcrypto
- Functions: `encrypt_token()`, `decrypt_token()`
- ⚠️ Update encryption key in production

**SSL/TLS**:
- All database connections use SSL
- Certificate verification enabled for Supabase

### Audit Logging

**Change Tracking**:
- `audit_logs` table tracks all sensitive operations
- `audio_match_history` logs match verification changes
- `feature_flag_history` tracks feature flag modifications
- All via database triggers (automatic)

### Rate Limiting

**API Protection**:
- `rate_limits` table tracks usage per user/IP
- Configured per endpoint
- Prevents abuse and DDoS attacks

### Security Best Practices

**DO**:
- ✅ Always use service role key server-side only
- ✅ Test RLS policies before production deployment
- ✅ Enable RLS on all new tables immediately
- ✅ Regular security audits (monthly linter, quarterly full review)
- ✅ Keep encryption keys secure and rotate regularly
- ✅ Monitor audit logs for suspicious activity

**DON'T**:
- ❌ Never expose service role key to client-side code
- ❌ Never use `USING (true)` for user-facing policies
- ❌ Never skip RLS when creating tables
- ❌ Never trust client-provided user IDs
- ❌ Never store sensitive data without encryption
- ❌ Never disable RLS "temporarily" in production

### Security Documentation

For detailed security information, see:
- **[Security Audit Log](../security/SECURITY_AUDIT_LOG.md)** - All security activities and incidents
- **[RLS Policy Documentation](../security/RLS_POLICY_DOCUMENTATION.md)** - Complete policy reference
- **Migration Files**: `013_enable_rls.sql`, `014_fix_function_search_path.sql`

### Known Security Issues

**Resolved**:
- ✅ RLS disabled on 44 tables (fixed 2025-10-28)
- ✅ Function search_path mutable on 12 functions (fixed 2025-10-28)

**Pending**:
- ⚠️ YouTube API key exposed client-side (`NEXT_PUBLIC_YOUTUBE_API_KEY`) - should be server-side only
- ⚠️ Postgres version 17.4.1.064 has available patches - upgrade recommended

**Future Improvements**:
- Implement API rate limiting in application layer
- Add real-time intrusion detection
- Enable database query logging in production
- Implement automated security testing in CI/CD