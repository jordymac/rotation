# Row Level Security (RLS) Policy Documentation

This document provides comprehensive documentation of all Row Level Security policies implemented in the Rotation application database.

## Overview

**Implementation Date**: 2025-10-28
**Migration File**: `migrations/013_enable_rls.sql`
**Total Tables Secured**: 44
**Total Policies Created**: 72

## Security Model

The Rotation application uses a three-tier security model:

### 1. Service Role (Backend API)
- **Who**: Next.js API routes with `SUPABASE_SERVICE_ROLE_KEY`
- **Access**: Full unrestricted access to all tables
- **Use Case**: Server-side operations, admin functions, background jobs
- **Risk Level**: Low (key never exposed to client)

### 2. Authenticated Users
- **Who**: Logged-in users via Clerk authentication
- **Access**: Read/write own data, read public content
- **Use Case**: User interactions, personal data management
- **Risk Level**: Medium (requires authentication)

### 3. Anonymous Users
- **Who**: Public visitors without authentication
- **Access**: Read-only access to public content
- **Use Case**: Browsing stores, viewing releases, discovering music
- **Risk Level**: High (no authentication)

## Policy Naming Convention

All policies follow this naming pattern:
```
[Role] [Action] [Condition] [Table]

Examples:
- "Service role has full access to users"
- "Users can read own data"
- "Public can read active stores"
```

## Tables & Policies Reference

### Layer 1: Identity Tables

#### `users` Table
**Purpose**: User accounts and authentication data

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to users | `service_role` | ALL | Always |
| Users can read own data | `authenticated` | SELECT | `id = auth.uid()` or `id::uuid = auth.uid()` |

**Security Notes**:
- Service role needed for user creation/management
- Users can only read their own profile data
- No public access to user table
- Prevents user enumeration attacks

---

#### `stores` Table
**Purpose**: Record store information and business details

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to stores | `service_role` | ALL | Always |
| Public can read active stores | `anon`, `authenticated` | SELECT | `status = 'active'` |

**Security Notes**:
- Only active stores visible to public
- Prevents exposure of pending/suspended stores
- Store owners manage via API routes (service role)

---

#### `store_managers` Table
**Purpose**: Many-to-many relationship for store management

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to store_managers | `service_role` | ALL | Always |
| Store managers can read own assignments | `authenticated` | SELECT | `user_id::uuid = auth.uid()` |

**Security Notes**:
- Store managers can see their assigned stores
- Prevents enumeration of other managers
- Store owner assigns managers via API

---

#### `discogs_tokens` Table ⚠️
**Purpose**: Encrypted OAuth tokens for Discogs API

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role ONLY access to discogs_tokens | `service_role` | ALL | Always |

**Security Notes**:
- **CRITICAL**: No public or user access - service role ONLY
- Contains sensitive OAuth credentials
- Tokens should be encrypted at rest
- Never expose via API responses

---

### Layer 2: Core Content Tables

#### `records` Table
**Purpose**: Vinyl release catalog from Discogs

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to records | `service_role` | ALL | Always |
| Public can read active records | `anon`, `authenticated` | SELECT | Always |

**Security Notes**:
- Public read access for discovery
- Only service role can create/update records
- Enables browsing without authentication

---

#### `tracks` Table
**Purpose**: Individual tracks within releases

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to tracks | `service_role` | ALL | Always |
| Public can read tracks | `anon`, `authenticated` | SELECT | Always |

**Security Notes**:
- Public read access for music discovery
- Track data not sensitive
- Service role manages track creation

---

#### `store_inventory` Table
**Purpose**: Specific inventory items for sale

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to store_inventory | `service_role` | ALL | Always |
| Public can read available inventory | `anon`, `authenticated` | SELECT | Always |

**Security Notes**:
- Public access enables browsing store inventory
- Pricing and availability are public
- Service role manages inventory updates

---

### Layer 3: Matching & Enrichment Tables

#### `audio_matches` Table
**Purpose**: Audio preview links with confidence scoring

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to audio_matches | `service_role` | ALL | Always |
| Public can read verified audio_matches | `anon`, `authenticated` | SELECT | `status IN ('verified', 'auto_approved')` |

**Security Notes**:
- Only verified matches visible to public
- Prevents exposure of low-confidence matches
- Unverified matches hidden until review

---

#### `audio_match_history` Table
**Purpose**: Audit trail for match changes

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to audio_match_history | `service_role` | ALL | Always |

**Security Notes**:
- Admin-only audit trail
- No public access needed
- Tracks verification changes

---

#### `match_candidates` Table
**Purpose**: Temporary storage during matching

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to match_candidates | `service_role` | ALL | Always |

**Security Notes**:
- Internal processing table
- Auto-expires after 1 hour
- No public access needed

---

#### `audio_quality_metrics` Table
**Purpose**: Audio quality analysis

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to audio_quality_metrics | `service_role` | ALL | Always |

**Security Notes**:
- Internal metrics table
- No public access needed
- Used for quality scoring

---

#### `metadata_cache` Table
**Purpose**: Cache for expensive API calls

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to metadata_cache | `service_role` | ALL | Always |

**Security Notes**:
- Performance optimization table
- No public access needed
- Contains cached API responses

---

#### `track_matches` Table (Legacy)
**Purpose**: Original track matching system

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to track_matches | `service_role` | ALL | Always |

**Security Notes**:
- Deprecated - use `audio_matches` instead
- Maintained for backward compatibility
- No public access needed

---

### Layer 4: User Features Tables

#### `favorites` Table
**Purpose**: User bookmarks for tracks/releases

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to favorites | `service_role` | ALL | Always |
| Users can manage own favorites | `authenticated` | ALL | `user_id::uuid = auth.uid()` |

**Security Notes**:
- Users can only see/manage their own favorites
- Prevents other users from viewing favorites
- Requires authentication

---

#### `play_history` Table
**Purpose**: Listening history and analytics

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to play_history | `service_role` | ALL | Always |
| Users can read own play_history | `authenticated` | SELECT | `user_id::uuid = auth.uid()` |

**Security Notes**:
- Users can view their own listening history
- No write access for users (prevents tampering)
- Service role logs plays via API

---

#### `feedback` Table
**Purpose**: User-reported issues and suggestions

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to feedback | `service_role` | ALL | Always |
| Users can read own feedback | `authenticated` | SELECT | `user_id::uuid = auth.uid()` |

**Security Notes**:
- Users can view feedback they submitted
- Service role manages feedback lifecycle
- Admin responses via service role

---

#### `user_collections` Table
**Purpose**: User-created playlists

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to user_collections | `service_role` | ALL | Always |
| Users can manage own collections | `authenticated` | ALL | `user_id::uuid = auth.uid()` |

**Security Notes**:
- Users have full control over their collections
- Private collections not visible to others
- Public collections require separate logic

---

#### `user_collection_items` Table
**Purpose**: Tracks within collections

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to user_collection_items | `service_role` | ALL | Always |
| Users can manage own collection_items | `authenticated` | ALL | Collection belongs to user |

**Security Notes**:
- Users can manage items in their collections only
- Requires subquery to verify collection ownership
- Prevents unauthorized collection manipulation

**Policy Logic**:
```sql
EXISTS (
  SELECT 1 FROM user_collections
  WHERE id = user_collection_items.collection_id
  AND user_id::uuid = auth.uid()
)
```

---

#### `user_follows` Table
**Purpose**: User following relationships

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to user_follows | `service_role` | ALL | Always |
| Users can manage own follows | `authenticated` | ALL | `follower_id::uuid = auth.uid()` |

**Security Notes**:
- Users can manage who they follow
- Cannot modify other users' follows
- Following data private by default

---

#### `user_preferences` Table
**Purpose**: User settings and preferences

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to user_preferences | `service_role` | ALL | Always |
| Users can manage own preferences | `authenticated` | ALL | `user_id::uuid = auth.uid()` |

**Security Notes**:
- Users have full control over preferences
- Preferences are private
- No default public access

---

### Layer 5: Analytics & Admin Tables

#### `jobs` Table
**Purpose**: Background job tracking

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to jobs | `service_role` | ALL | Always |

**Security Notes**:
- Admin-only table
- Contains job metadata and progress
- No public access needed

---

#### `job_logs` Table
**Purpose**: Detailed job execution logs

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to job_logs | `service_role` | ALL | Always |

**Security Notes**:
- Admin debugging data
- May contain sensitive error messages
- Service role only

---

#### `audit_logs` Table
**Purpose**: System audit trail

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to audit_logs | `service_role` | ALL | Always |

**Security Notes**:
- Critical security audit data
- Contains change history
- Must remain service role only

---

#### `usage_metrics` Table
**Purpose**: User interaction tracking

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to usage_metrics | `service_role` | ALL | Always |

**Security Notes**:
- Analytics data
- May contain PII (IP addresses, user agents)
- Service role only for privacy

---

#### `daily_metrics` Table
**Purpose**: Aggregated analytics

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to daily_metrics | `service_role` | ALL | Always |

**Security Notes**:
- Aggregated data less sensitive
- Still admin-only for business intelligence
- Service role only

---

#### `recommendation_data` Table
**Purpose**: Personalization engine data

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to recommendation_data | `service_role` | ALL | Always |

**Security Notes**:
- User preference learning data
- Service role manages recommendations
- Private user data

---

#### `content_similarity` Table
**Purpose**: Content recommendation matrix

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to content_similarity | `service_role` | ALL | Always |

**Security Notes**:
- Internal recommendation data
- No public access needed
- Service role only

---

#### `performance_metrics` Table
**Purpose**: System performance monitoring

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to performance_metrics | `service_role` | ALL | Always |

**Security Notes**:
- Internal monitoring data
- May reveal system architecture
- Service role only

---

### Layer 6: Configuration Tables

#### `settings` Table
**Purpose**: System configuration

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to settings | `service_role` | ALL | Always |
| Public can read public settings | `anon`, `authenticated` | SELECT | `is_public = true` |

**Security Notes**:
- Public settings visible to all (e.g., site name)
- Private settings service role only (e.g., API keys)
- Enables public configuration without exposure

---

#### `feature_flags` Table
**Purpose**: Feature flag management

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to feature_flags | `service_role` | ALL | Always |

**Security Notes**:
- Internal feature management
- No public access to flag config
- Service role evaluates flags

---

#### `feature_flag_history` Table
**Purpose**: Flag change audit trail

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to feature_flag_history | `service_role` | ALL | Always |

**Security Notes**:
- Audit trail for flag changes
- Admin-only data
- Service role only

---

#### `feature_flag_evaluations` Table
**Purpose**: Flag evaluation logs

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to feature_flag_evaluations | `service_role` | ALL | Always |

**Security Notes**:
- Analytics for flag usage
- Service role only
- No public access

---

#### `config_profiles` Table
**Purpose**: Environment configuration profiles

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to config_profiles | `service_role` | ALL | Always |

**Security Notes**:
- Environment-specific configs
- May contain sensitive settings
- Service role only

---

#### `maintenance_windows` Table
**Purpose**: Scheduled maintenance tracking

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to maintenance_windows | `service_role` | ALL | Always |

**Security Notes**:
- Internal scheduling data
- Service role only
- Consider making public READ for status pages

---

#### `rate_limits` Table
**Purpose**: API rate limiting state

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to rate_limits | `service_role` | ALL | Always |

**Security Notes**:
- Security feature data
- Must remain service role only
- Prevents rate limit evasion

---

#### `cache_config` Table
**Purpose**: Cache management rules

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to cache_config | `service_role` | ALL | Always |

**Security Notes**:
- Performance config
- Service role only
- No public access needed

---

### Layer 7: Processing & Releases Tables

#### `releases` Table
**Purpose**: Cached release data with audio matches

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to releases | `service_role` | ALL | Always |
| Public can read releases with audio matches | `anon`, `authenticated` | SELECT | `has_audio_matches = true` |

**Security Notes**:
- Only releases with audio previews visible
- Prevents exposure of incomplete releases
- Enables public browsing

---

#### `store_sync_log` Table
**Purpose**: Store synchronization history

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to store_sync_log | `service_role` | ALL | Always |

**Security Notes**:
- Internal sync tracking
- Service role only
- No public access needed

---

#### `processing_queue` Table
**Purpose**: Background processing queue

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to processing_queue | `service_role` | ALL | Always |

**Security Notes**:
- Internal job queue
- Service role only
- No public access needed

---

#### `admin_stores` Table
**Purpose**: Administrative store data

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to admin_stores | `service_role` | ALL | Always |

**Security Notes**:
- Admin-only store data
- Service role only
- Contains sensitive business information

---

#### `migrations` Table
**Purpose**: Database migration tracking

| Policy Name | Role | Operations | Condition |
|------------|------|------------|-----------|
| Service role has full access to migrations | `service_role` | ALL | Always |

**Security Notes**:
- System metadata table
- Service role only
- No public access needed

---

## Policy Testing

### Test Service Role Access
```javascript
import { supabase } from '@/lib/supabase'

// Should succeed with service role key
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(1)

console.log(data) // Should return data
console.log(error) // Should be null
```

### Test Authenticated User Access
```javascript
// Assumes user is authenticated via Clerk
const userId = auth().userId

// Should succeed - user's own data
const { data: myData } = await supabase
  .from('favorites')
  .select('*')
  .eq('user_id', userId)

// Should return empty - other user's data
const otherUserId = 'other-user-uuid'
const { data: otherData } = await supabase
  .from('favorites')
  .select('*')
  .eq('user_id', otherUserId)

console.log(otherData) // Should be []
```

### Test Anonymous Access
```javascript
// No authentication

// Should succeed - public data
const { data: stores } = await supabase
  .from('stores')
  .select('*')
  .eq('status', 'active')

// Should fail - sensitive data
const { data: tokens, error } = await supabase
  .from('discogs_tokens')
  .select('*')

console.log(error) // Should have permission error
```

## Common Policy Patterns

### Pattern 1: Service Role Full Access
```sql
CREATE POLICY "Service role has full access to [table]"
  ON [table]
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Pattern 2: Users Manage Own Data
```sql
CREATE POLICY "Users can manage own [resource]"
  ON [table]
  FOR ALL
  TO authenticated
  USING (user_id::uuid = auth.uid())
  WITH CHECK (user_id::uuid = auth.uid());
```

### Pattern 3: Public Read Access
```sql
CREATE POLICY "Public can read [condition] [resource]"
  ON [table]
  FOR SELECT
  TO anon, authenticated
  USING ([condition]);
```

### Pattern 4: Join-Based Access Control
```sql
CREATE POLICY "Users can manage [resource] in own [parent]"
  ON [child_table]
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM [parent_table]
      WHERE id = [child_table].[parent_id]
      AND user_id::uuid = auth.uid()
    )
  );
```

## Troubleshooting

### Permission Denied Errors

**Symptom**: `permission denied for table [table_name]`

**Causes**:
1. User not authenticated
2. Wrong role (anon instead of authenticated)
3. Policy condition not met
4. Missing service role key

**Solutions**:
- Verify authentication state
- Check user ID matches condition
- Use service role for admin operations
- Review policy conditions

### Policy Not Working

**Symptom**: User can access data they shouldn't

**Debugging Steps**:
1. Check if RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = '[table]'`
2. List policies: `SELECT * FROM pg_policies WHERE tablename = '[table]'`
3. Verify policy logic with `EXPLAIN`
4. Check for conflicting policies

### Performance Issues

**Symptom**: Slow queries after enabling RLS

**Causes**:
1. Complex policy conditions
2. Missing indexes
3. Subquery performance

**Solutions**:
- Simplify policy conditions
- Add indexes on user_id columns
- Use materialized views for complex checks
- Consider denormalization

## Security Best Practices

### DO:
✅ Use service role for all admin operations
✅ Keep service role key server-side only
✅ Test policies thoroughly before production
✅ Use `auth.uid()` for user identification
✅ Add indexes on filtered columns
✅ Document all policy changes
✅ Review policies during security audits

### DON'T:
❌ Expose service role key client-side
❌ Use `USING (true)` for user-facing roles
❌ Trust client-provided user IDs
❌ Skip policy testing
❌ Create overly complex policies
❌ Forget to enable RLS on new tables

## Maintenance

### Adding New Tables
1. Enable RLS: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`
2. Create service role policy (mandatory)
3. Create user policies (if applicable)
4. Add public policies (if applicable)
5. Test all access patterns
6. Document in this file

### Modifying Policies
1. Review impact on existing functionality
2. Test changes in development
3. Deploy during low-traffic period
4. Monitor error logs
5. Update documentation

### Regular Audits
- Monthly: Review Supabase linter
- Quarterly: Full security review
- Annually: Third-party audit
- On-demand: After security incidents

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Security Audit Log](./SECURITY_AUDIT_LOG.md)
- [Database Schema](../workflows/database-schema.md)
