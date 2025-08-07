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