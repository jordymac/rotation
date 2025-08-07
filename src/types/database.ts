/**
 * Comprehensive TypeScript interfaces for all database entities
 * Auto-generated from database schema migrations
 */

// =====================================
// ENUMS - Match database enum types
// =====================================

export type UserRole = 'admin' | 'store_manager' | 'general_user';
export type StoreStatus = 'active' | 'pending' | 'suspended' | 'inactive';
export type RecordStatus = 'active' | 'sold' | 'reserved' | 'draft' | 'removed';
export type RecordCondition = 'Mint (M)' | 'Near Mint (NM or M-)' | 'Very Good Plus (VG+)' | 'Very Good (VG)' | 'Good Plus (G+)' | 'Good (G)' | 'Fair (F)' | 'Poor (P)';
export type SleeveCondition = 'Mint (M)' | 'Near Mint (NM or M-)' | 'Very Good Plus (VG+)' | 'Very Good (VG)' | 'Good Plus (G+)' | 'Good (G)' | 'Fair (F)' | 'Poor (P)' | 'No Cover';
export type MatchStatus = 'unverified' | 'verified' | 'needs_review' | 'rejected' | 'auto_approved';
export type AudioPlatform = 'youtube' | 'soundcloud' | 'spotify' | 'bandcamp' | 'discogs';
export type FeedbackType = 'bad_match' | 'missing_audio' | 'wrong_metadata' | 'copyright_issue' | 'quality_issue' | 'suggestion';
export type FeedbackStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
export type PlayAction = 'play' | 'pause' | 'skip' | 'complete' | 'seek';
export type JobType = 'store_sync' | 'audio_matching' | 'metadata_refresh' | 'image_processing' | 'backup' | 'cleanup' | 'migration';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying';
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type SettingType = 'string' | 'number' | 'boolean' | 'json' | 'array';
export type FeatureFlagType = 'boolean' | 'percentage' | 'user_list' | 'condition';

// =====================================
// CORE ENTITIES
// =====================================

export interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
  role: UserRole;
  profile_image_url?: string;
  bio?: string;
  location?: string;
  website_url?: string;
  is_verified: boolean;
  is_active: boolean;
  last_login_at?: Date;
  email_verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  discogs_username: string;
  discogs_store_id?: string;
  owner_user_id?: number;
  status: StoreStatus;
  description?: string;
  website_url?: string;
  location?: string;
  logo_url?: string;
  banner_url?: string;
  contact_email?: string;
  phone?: string;
  business_hours?: Record<string, any>;
  shipping_info?: Record<string, any>;
  policies?: string;
  average_rating: number;
  total_reviews: number;
  total_releases: number;
  verified_at?: Date;
  last_sync_at?: Date;
  sync_frequency_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface StoreManager {
  id: number;
  store_id: number;
  user_id: number;
  role: string;
  permissions: string[];
  invited_by?: number;
  invited_at: Date;
  accepted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Record {
  id: number;
  discogs_release_id: number;
  title: string;
  artist: string;
  artist_sort?: string;
  label?: string;
  catalog_number?: string;
  release_year?: number;
  release_date?: Date;
  country?: string;
  genres: string[];
  styles: string[];
  format?: string;
  format_details?: Record<string, any>;
  images: string[];
  videos: string[];
  notes?: string;
  data_quality?: string;
  master_id?: number;
  master_url?: string;
  discogs_url?: string;
  barcode?: string;
  total_tracks: number;
  total_duration_seconds: number;
  metadata_last_updated?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface StoreInventory {
  id: number;
  store_id: number;
  record_id: number;
  discogs_listing_id?: number;
  status: RecordStatus;
  price?: number;
  currency: string;
  condition?: RecordCondition;
  sleeve_condition?: SleeveCondition;
  description?: string;
  quantity: number;
  weight_grams?: number;
  ships_from?: string;
  shipping_cost?: number;
  allow_offers: boolean;
  featured: boolean;
  view_count: number;
  wishlist_count: number;
  listed_at: Date;
  sold_at?: Date;
  reserved_until?: Date;
  last_synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Track {
  id: number;
  record_id: number;
  position: string;
  title: string;
  duration_seconds?: number;
  duration_display?: string;
  artists: Record<string, any>[];
  credits: Record<string, any>[];
  track_index?: number;
  side_index?: number;
  track_on_side?: number;
  bpm?: number;
  key_signature?: string;
  genre_tags: string[];
  mood_tags: string[];
  instrument_tags: string[];
  created_at: Date;
  updated_at: Date;
}

// =====================================
// AUDIO MATCHING & METADATA
// =====================================

export interface AudioMatch {
  id: number;
  track_id: number;
  platform: AudioPlatform;
  external_id: string;
  url: string;
  title?: string;
  artist?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  embed_url?: string;
  confidence_score: number;
  status: MatchStatus;
  match_reason?: string;
  quality_score?: number;
  popularity_score: number;
  is_official: boolean;
  is_explicit: boolean;
  language?: string;
  last_checked_at: Date;
  verified_by?: number;
  verified_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MetadataCache {
  id: number;
  entity_type: string;
  entity_id: number;
  cache_key: string;
  data: Record<string, any>;
  expires_at?: Date;
  last_refreshed_at: Date;
  refresh_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface AudioMatchHistory {
  id: number;
  audio_match_id: number;
  action: string;
  old_status?: MatchStatus;
  new_status?: MatchStatus;
  old_confidence?: number;
  new_confidence?: number;
  notes?: string;
  performed_by?: number;
  performed_at: Date;
}

export interface MatchCandidate {
  id: number;
  track_id: number;
  session_id: string;
  platform: AudioPlatform;
  external_id: string;
  url: string;
  title?: string;
  artist?: string;
  duration_seconds?: number;
  confidence_score: number;
  quality_indicators: Record<string, any>;
  metadata: Record<string, any>;
  created_at: Date;
  expires_at: Date;
}

export interface AudioQualityMetrics {
  id: number;
  audio_match_id: number;
  bitrate?: number;
  sample_rate?: number;
  channels?: number;
  format?: string;
  file_size_bytes?: number;
  dynamic_range?: number;
  peak_volume?: number;
  loudness_lufs?: number;
  silence_ratio?: number;
  distortion_score?: number;
  noise_floor?: number;
  analysis_version: string;
  analyzed_at: Date;
  created_at: Date;
}

// =====================================
// USER FEATURES
// =====================================

export interface Favorite {
  id: number;
  user_id: number;
  favoritable_type: string;
  favoritable_id: number;
  notes?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PlayHistory {
  id: number;
  user_id?: number;
  track_id: number;
  audio_match_id?: number;
  session_id?: string;
  action: PlayAction;
  position_seconds: number;
  duration_listened_seconds: number;
  completion_percentage: number;
  source_context?: string;
  device_type?: string;
  user_agent?: string;
  ip_address?: string;
  country_code?: string;
  city?: string;
  referrer_url?: string;
  played_at: Date;
  created_at: Date;
}

export interface Feedback {
  id: number;
  user_id?: number;
  feedback_type: FeedbackType;
  status: FeedbackStatus;
  subject_type: string;
  subject_id: number;
  title: string;
  description: string;
  suggested_fix?: string;
  priority: number;
  tags: string[];
  metadata: Record<string, any>;
  assigned_to?: number;
  assigned_at?: Date;
  resolved_at?: Date;
  resolution_notes?: string;
  is_duplicate_of?: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserCollection {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  is_public: boolean;
  is_collaborative: boolean;
  cover_image_url?: string;
  color_scheme?: string;
  tags: string[];
  total_tracks: number;
  total_duration_seconds: number;
  play_count: number;
  like_count: number;
  share_count: number;
  last_played_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserCollectionItem {
  id: number;
  collection_id: number;
  track_id: number;
  position: number;
  added_by?: number;
  notes?: string;
  added_at: Date;
}

export interface UserFollow {
  id: number;
  follower_id: number;
  followable_type: string;
  followable_id: number;
  notifications_enabled: boolean;
  followed_at: Date;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  preferred_audio_platforms: string[];
  auto_play_enabled: boolean;
  crossfade_enabled: boolean;
  crossfade_duration_seconds: number;
  volume_level: number;
  preferred_genres: string[];
  excluded_genres: string[];
  preferred_decades: number[];
  feed_algorithm_preference: string;
  show_explicit_content: boolean;
  data_usage_preference: string;
  notification_preferences: Record<string, any>;
  privacy_settings: Record<string, any>;
  theme_preference: string;
  language_preference: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

// =====================================
// ADMIN & ANALYTICS
// =====================================

export interface Job {
  id: number;
  type: JobType;
  status: JobStatus;
  title: string;
  description?: string;
  priority: number;
  progress_percentage: number;
  current_step?: string;
  total_steps?: number;
  completed_steps: number;
  parameters: Record<string, any>;
  result: Record<string, any>;
  error_message?: string;
  error_details?: Record<string, any>;
  retry_count: number;
  max_retries: number;
  scheduled_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  estimated_completion_at?: Date;
  initiated_by?: number;
  assigned_to?: string;
  parent_job_id?: number;
  depends_on_job_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface JobLog {
  id: number;
  job_id: number;
  level: LogLevel;
  message: string;
  details: Record<string, any>;
  step_name?: string;
  execution_time_ms?: number;
  memory_usage_mb?: number;
  logged_at: Date;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata: Record<string, any>;
  performed_at: Date;
}

export interface UsageMetric {
  id: number;
  user_id?: number;
  session_id?: string;
  event_type: string;
  event_name: string;
  entity_type?: string;
  entity_id?: number;
  properties: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
  country_code?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  referrer_url?: string;
  page_url?: string;
  timestamp: Date;
}

export interface DailyMetric {
  id: number;
  metric_date: Date;
  metric_type: string;
  entity_type?: string;
  entity_id?: number;
  metric_name: string;
  metric_value: number;
  additional_data: Record<string, any>;
  created_at: Date;
}

export interface RecommendationData {
  id: number;
  user_id: number;
  recommendation_type: string;
  data_key: string;
  data_value: number;
  confidence: number;
  evidence_count: number;
  last_updated_at: Date;
  expires_at?: Date;
  created_at: Date;
}

export interface ContentSimilarity {
  id: number;
  source_type: string;
  source_id: number;
  target_type: string;
  target_id: number;
  similarity_score: number;
  similarity_type: string;
  calculation_method?: string;
  confidence: number;
  calculated_at: Date;
  expires_at: Date;
}

export interface PerformanceMetric {
  id: number;
  metric_type: string;
  endpoint?: string;
  operation?: string;
  duration_ms?: number;
  success: boolean;
  error_type?: string;
  metadata: Record<string, any>;
  measured_at: Date;
}

// =====================================
// CONFIGURATION & FEATURE FLAGS
// =====================================

export interface Setting {
  id: number;
  key: string;
  value?: string;
  value_type: SettingType;
  category: string;
  description?: string;
  is_public: boolean;
  is_encrypted: boolean;
  default_value?: string;
  validation_rules: Record<string, any>;
  last_modified_by?: number;
  last_modified_at: Date;
  created_at: Date;
}

export interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description?: string;
  flag_type: FeatureFlagType;
  is_enabled: boolean;
  rollout_percentage: number;
  target_users: number[];
  conditions: Record<string, any>;
  metadata: Record<string, any>;
  environment: string;
  created_by?: number;
  last_modified_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface FeatureFlagHistory {
  id: number;
  feature_flag_id: number;
  action: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  rollout_percentage_old?: number;
  rollout_percentage_new?: number;
  changed_by?: number;
  change_reason?: string;
  changed_at: Date;
}

export interface FeatureFlagEvaluation {
  id: number;
  feature_flag_id: number;
  user_id?: number;
  session_id?: string;
  evaluation_result: boolean;
  evaluation_context: Record<string, any>;
  evaluated_at: Date;
}

export interface ConfigProfile {
  id: number;
  name: string;
  description?: string;
  environment: string;
  is_active: boolean;
  config_data: Record<string, any>;
  schema_version: string;
  created_by?: number;
  activated_by?: number;
  activated_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RateLimit {
  id: number;
  identifier: string;
  identifier_type: string;
  endpoint_pattern: string;
  requests_per_window: number;
  window_duration_seconds: number;
  burst_allowance: number;
  current_count: number;
  window_start: Date;
  is_blocked: boolean;
  blocked_until?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CacheConfig {
  id: number;
  cache_key_pattern: string;
  ttl_seconds: number;
  max_size_mb?: number;
  compression_enabled: boolean;
  cache_strategy: string;
  invalidation_rules: Record<string, any>[];
  monitoring_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MaintenanceWindow {
  id: number;
  title: string;
  description?: string;
  maintenance_type: string;
  affected_services: string[];
  starts_at: Date;
  ends_at: Date;
  is_emergency: boolean;
  status: string;
  impact_level: string;
  notification_sent: boolean;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

// =====================================
// LEGACY TYPES (for backward compatibility)
// =====================================

export interface TrackMatchRecord {
  id?: number;
  release_id: number;
  track_index: number;
  platform: string;
  match_url: string;
  confidence: number;
  approved: boolean;
  verified_by?: string;
  verified_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface DiscogsTokenRecord {
  id?: number;
  username: string;
  access_token: string;
  access_secret: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: Date;
  scope?: string;
  created_at?: Date;
  updated_at?: Date;
  last_used_at?: Date;
}

// =====================================
// UTILITY TYPES
// =====================================

export type EntityType = 'user' | 'store' | 'record' | 'track' | 'audio_match';
export type FavoritableType = 'track' | 'record' | 'store' | 'audio_match';
export type FollowableType = 'user' | 'store';

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}