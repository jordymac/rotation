/**
 * Database service layer with CRUD operations for all entities
 * Built on top of the existing db.ts foundation
 */

import { getDatabase } from './db';
import type {
  User, Store, StoreManager, Record, StoreInventory, Track,
  AudioMatch, MetadataCache, Favorite, PlayHistory, Feedback,
  UserCollection, UserCollectionItem, UserPreferences,
  Job, JobLog, AuditLog, UsageMetric, Setting, FeatureFlag,
  PaginatedResponse, ApiResponse
} from '../types/database';

// =====================================
// CORE USER OPERATIONS
// =====================================

export class UserService {
  private db = getDatabase();

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const user = await this.db.one(
      `INSERT INTO users (email, name, username, role, profile_image_url, bio, location, website_url, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userData.email, userData.name, userData.username, userData.role,
        userData.profile_image_url, userData.bio, userData.location, userData.website_url,
        userData.is_verified, userData.is_active
      ]
    );
    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.db.oneOrNone('SELECT * FROM users WHERE id = $1', [id]);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await this.db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const values = fields.map(field => updates[field as keyof User]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const user = await this.db.one(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.result('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async getUsers(page = 1, limit = 20, filters: Partial<User> = {}): Promise<PaginatedResponse<User>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Build dynamic filters
    if (filters.role) {
      params.push(filters.role);
      whereClause += ` AND role = $${params.length}`;
    }
    if (filters.is_active !== undefined) {
      params.push(filters.is_active);
      whereClause += ` AND is_active = $${params.length}`;
    }

    const [users, countResult] = await Promise.all([
      this.db.manyOrNone(
        `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      this.db.one(`SELECT COUNT(*) as total FROM users ${whereClause}`, params)
    ]);

    const total = parseInt(countResult.total);
    return {
      data: users || [],
      total,
      page,
      limit,
      has_next: offset + limit < total,
      has_prev: page > 1
    };
  }
}

// =====================================
// STORE OPERATIONS
// =====================================

export class StoreService {
  private db = getDatabase();

  async createStore(storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Promise<Store> {
    const store = await this.db.one(
      `INSERT INTO stores (name, slug, discogs_username, discogs_store_id, owner_user_id, status, description, 
       website_url, location, logo_url, banner_url, contact_email, phone, business_hours, shipping_info, policies)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        storeData.name, storeData.slug, storeData.discogs_username, storeData.discogs_store_id,
        storeData.owner_user_id, storeData.status, storeData.description, storeData.website_url,
        storeData.location, storeData.logo_url, storeData.banner_url, storeData.contact_email,
        storeData.phone, storeData.business_hours, storeData.shipping_info, storeData.policies
      ]
    );
    return store;
  }

  async getStoreById(id: number): Promise<Store | null> {
    return await this.db.oneOrNone('SELECT * FROM stores WHERE id = $1', [id]);
  }

  async getStoreBySlug(slug: string): Promise<Store | null> {
    return await this.db.oneOrNone('SELECT * FROM stores WHERE slug = $1', [slug]);
  }

  async getStoreByDiscogsUsername(username: string): Promise<Store | null> {
    return await this.db.oneOrNone('SELECT * FROM stores WHERE discogs_username = $1', [username]);
  }

  async updateStore(id: number, updates: Partial<Store>): Promise<Store> {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const values = fields.map(field => updates[field as keyof Store]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const store = await this.db.one(
      `UPDATE stores SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return store;
  }

  async getStores(page = 1, limit = 20, filters: Partial<Store> = {}): Promise<PaginatedResponse<Store>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.status) {
      params.push(filters.status);
      whereClause += ` AND status = $${params.length}`;
    }
    if (filters.location) {
      params.push(`%${filters.location}%`);
      whereClause += ` AND location ILIKE $${params.length}`;
    }

    const [stores, countResult] = await Promise.all([
      this.db.manyOrNone(
        `SELECT * FROM stores ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      this.db.one(`SELECT COUNT(*) as total FROM stores ${whereClause}`, params)
    ]);

    const total = parseInt(countResult.total);
    return {
      data: stores || [],
      total,
      page,
      limit,
      has_next: offset + limit < total,
      has_prev: page > 1
    };
  }
}

// =====================================
// RECORD OPERATIONS
// =====================================

export class RecordService {
  private db = getDatabase();

  async createRecord(recordData: Omit<Record, 'id' | 'created_at' | 'updated_at'>): Promise<Record> {
    const record = await this.db.one(
      `INSERT INTO records (discogs_release_id, title, artist, artist_sort, label, catalog_number,
       release_year, release_date, country, genres, styles, format, format_details, images, videos,
       notes, data_quality, master_id, master_url, discogs_url, barcode, total_tracks, total_duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       RETURNING *`,
      [
        recordData.discogs_release_id, recordData.title, recordData.artist, recordData.artist_sort,
        recordData.label, recordData.catalog_number, recordData.release_year, recordData.release_date,
        recordData.country, recordData.genres, recordData.styles, recordData.format, recordData.format_details,
        recordData.images, recordData.videos, recordData.notes, recordData.data_quality, recordData.master_id,
        recordData.master_url, recordData.discogs_url, recordData.barcode, recordData.total_tracks,
        recordData.total_duration_seconds
      ]
    );
    return record;
  }

  async getRecordById(id: number): Promise<Record | null> {
    return await this.db.oneOrNone('SELECT * FROM records WHERE id = $1', [id]);
  }

  async getRecordByDiscogsId(discogsId: number): Promise<Record | null> {
    return await this.db.oneOrNone('SELECT * FROM records WHERE discogs_release_id = $1', [discogsId]);
  }

  async searchRecords(query: string, page = 1, limit = 20): Promise<PaginatedResponse<Record>> {
    const offset = (page - 1) * limit;
    const searchTerms = query.toLowerCase().split(' ').map(term => `%${term}%`);
    
    let whereClause = `WHERE (
      LOWER(title) LIKE $1 OR 
      LOWER(artist) LIKE $1 OR 
      LOWER(label) LIKE $1 OR
      catalog_number ILIKE $1
    )`;

    const params = [searchTerms[0]];
    
    // Add additional search terms
    searchTerms.slice(1).forEach((term, index) => {
      params.push(term);
      whereClause += ` AND (
        LOWER(title) LIKE $${params.length} OR 
        LOWER(artist) LIKE $${params.length} OR 
        LOWER(label) LIKE $${params.length}
      )`;
    });

    const [records, countResult] = await Promise.all([
      this.db.manyOrNone(
        `SELECT * FROM records ${whereClause} ORDER BY release_year DESC, title ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      this.db.one(`SELECT COUNT(*) as total FROM records ${whereClause}`, params)
    ]);

    const total = parseInt(countResult.total);
    return {
      data: records || [],
      total,
      page,
      limit,
      has_next: offset + limit < total,
      has_prev: page > 1
    };
  }

  async getRecordsByGenre(genre: string, page = 1, limit = 20): Promise<PaginatedResponse<Record>> {
    const offset = (page - 1) * limit;

    const [records, countResult] = await Promise.all([
      this.db.manyOrNone(
        `SELECT * FROM records WHERE $1 = ANY(genres) ORDER BY release_year DESC LIMIT $2 OFFSET $3`,
        [genre, limit, offset]
      ),
      this.db.one(`SELECT COUNT(*) as total FROM records WHERE $1 = ANY(genres)`, [genre])
    ]);

    const total = parseInt(countResult.total);
    return {
      data: records || [],
      total,
      page,
      limit,
      has_next: offset + limit < total,
      has_prev: page > 1
    };
  }
}

// =====================================
// TRACK OPERATIONS
// =====================================

export class TrackService {
  private db = getDatabase();

  async createTrack(trackData: Omit<Track, 'id' | 'created_at' | 'updated_at'>): Promise<Track> {
    const track = await this.db.one(
      `INSERT INTO tracks (record_id, position, title, duration_seconds, duration_display, artists,
       credits, track_index, side_index, track_on_side, bpm, key_signature, genre_tags, mood_tags, instrument_tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        trackData.record_id, trackData.position, trackData.title, trackData.duration_seconds,
        trackData.duration_display, trackData.artists, trackData.credits, trackData.track_index,
        trackData.side_index, trackData.track_on_side, trackData.bpm, trackData.key_signature,
        trackData.genre_tags, trackData.mood_tags, trackData.instrument_tags
      ]
    );
    return track;
  }

  async getTrackById(id: number): Promise<Track | null> {
    return await this.db.oneOrNone('SELECT * FROM tracks WHERE id = $1', [id]);
  }

  async getTracksByRecordId(recordId: number): Promise<Track[]> {
    return await this.db.manyOrNone(
      'SELECT * FROM tracks WHERE record_id = $1 ORDER BY position',
      [recordId]
    ) || [];
  }

  async searchTracks(query: string, page = 1, limit = 20): Promise<PaginatedResponse<Track>> {
    const offset = (page - 1) * limit;
    const searchTerm = `%${query.toLowerCase()}%`;

    const [tracks, countResult] = await Promise.all([
      this.db.manyOrNone(
        `SELECT t.*, r.title as record_title, r.artist as record_artist 
         FROM tracks t 
         JOIN records r ON t.record_id = r.id 
         WHERE LOWER(t.title) LIKE $1 OR LOWER(r.artist) LIKE $1
         ORDER BY r.release_year DESC, t.position ASC 
         LIMIT $2 OFFSET $3`,
        [searchTerm, limit, offset]
      ),
      this.db.one(
        `SELECT COUNT(*) as total FROM tracks t 
         JOIN records r ON t.record_id = r.id 
         WHERE LOWER(t.title) LIKE $1 OR LOWER(r.artist) LIKE $1`,
        [searchTerm]
      )
    ]);

    const total = parseInt(countResult.total);
    return {
      data: tracks || [],
      total,
      page,
      limit,
      has_next: offset + limit < total,
      has_prev: page > 1
    };
  }
}

// =====================================
// AUDIO MATCH OPERATIONS
// =====================================

export class AudioMatchService {
  private db = getDatabase();

  async createAudioMatch(matchData: Omit<AudioMatch, 'id' | 'created_at' | 'updated_at'>): Promise<AudioMatch> {
    const match = await this.db.one(
      `INSERT INTO audio_matches (track_id, platform, external_id, url, title, artist, duration_seconds,
       thumbnail_url, embed_url, confidence_score, status, match_reason, quality_score, popularity_score,
       is_official, is_explicit, language, verified_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        matchData.track_id, matchData.platform, matchData.external_id, matchData.url,
        matchData.title, matchData.artist, matchData.duration_seconds, matchData.thumbnail_url,
        matchData.embed_url, matchData.confidence_score, matchData.status, matchData.match_reason,
        matchData.quality_score, matchData.popularity_score, matchData.is_official,
        matchData.is_explicit, matchData.language, matchData.verified_by
      ]
    );
    return match;
  }

  async getAudioMatchesByTrackId(trackId: number): Promise<AudioMatch[]> {
    return await this.db.manyOrNone(
      'SELECT * FROM audio_matches WHERE track_id = $1 ORDER BY confidence_score DESC',
      [trackId]
    ) || [];
  }

  async getBestMatchForTrack(trackId: number): Promise<AudioMatch | null> {
    return await this.db.oneOrNone(
      `SELECT * FROM audio_matches 
       WHERE track_id = $1 AND status = 'verified' 
       ORDER BY confidence_score DESC 
       LIMIT 1`,
      [trackId]
    );
  }

  async updateMatchStatus(id: number, status: string, verifiedBy?: number): Promise<AudioMatch> {
    const match = await this.db.one(
      `UPDATE audio_matches 
       SET status = $2, verified_by = $3, verified_at = CASE WHEN $2 = 'verified' THEN NOW() ELSE verified_at END
       WHERE id = $1 
       RETURNING *`,
      [id, status, verifiedBy]
    );
    return match;
  }

  async getMatchesNeedingReview(page = 1, limit = 20): Promise<PaginatedResponse<AudioMatch>> {
    const offset = (page - 1) * limit;

    const [matches, countResult] = await Promise.all([
      this.db.manyOrNone(
        `SELECT am.*, t.title as track_title, r.artist as record_artist, r.title as record_title
         FROM audio_matches am
         JOIN tracks t ON am.track_id = t.id
         JOIN records r ON t.record_id = r.id
         WHERE am.status = 'needs_review'
         ORDER BY am.confidence_score DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      this.db.one(
        'SELECT COUNT(*) as total FROM audio_matches WHERE status = \'needs_review\''
      )
    ]);

    const total = parseInt(countResult.total);
    return {
      data: matches || [],
      total,
      page,
      limit,
      has_next: offset + limit < total,
      has_prev: page > 1
    };
  }
}

// =====================================
// USER FEATURE OPERATIONS
// =====================================

export class UserFeaturesService {
  private db = getDatabase();

  // Favorites
  async addFavorite(userId: number, favoritableType: string, favoritableId: number, notes?: string): Promise<Favorite> {
    const favorite = await this.db.one(
      `INSERT INTO favorites (user_id, favoritable_type, favoritable_id, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, favoritable_type, favoritable_id) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [userId, favoritableType, favoritableId, notes]
    );
    return favorite;
  }

  async removeFavorite(userId: number, favoritableType: string, favoritableId: number): Promise<boolean> {
    const result = await this.db.result(
      'DELETE FROM favorites WHERE user_id = $1 AND favoritable_type = $2 AND favoritable_id = $3',
      [userId, favoritableType, favoritableId]
    );
    return result.rowCount > 0;
  }

  async getUserFavorites(userId: number, favoritableType?: string, page = 1, limit = 20): Promise<PaginatedResponse<Favorite>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (favoritableType) {
      params.push(favoritableType);
      whereClause += ` AND favoritable_type = $${params.length}`;
    }

    const [favorites, countResult] = await Promise.all([
      this.db.manyOrNone(
        `SELECT * FROM favorites ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      this.db.one(`SELECT COUNT(*) as total FROM favorites ${whereClause}`, params)
    ]);

    const total = parseInt(countResult.total);
    return {
      data: favorites || [],
      total,
      page,
      limit,
      has_next: offset + limit < total,
      has_prev: page > 1
    };
  }

  // Play History
  async recordPlay(playData: Omit<PlayHistory, 'id' | 'created_at'>): Promise<PlayHistory> {
    const play = await this.db.one(
      `INSERT INTO play_history (user_id, track_id, audio_match_id, session_id, action, position_seconds,
       duration_listened_seconds, completion_percentage, source_context, device_type, user_agent,
       ip_address, country_code, city, referrer_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        playData.user_id, playData.track_id, playData.audio_match_id, playData.session_id,
        playData.action, playData.position_seconds, playData.duration_listened_seconds,
        playData.completion_percentage, playData.source_context, playData.device_type,
        playData.user_agent, playData.ip_address, playData.country_code, playData.city,
        playData.referrer_url
      ]
    );
    return play;
  }

  async getUserPlayHistory(userId: number, page = 1, limit = 20): Promise<PaginatedResponse<PlayHistory>> {
    const offset = (page - 1) * limit;

    const [plays, countResult] = await Promise.all([
      this.db.manyOrNone(
        `SELECT ph.*, t.title as track_title, r.artist as record_artist, r.title as record_title
         FROM play_history ph
         JOIN tracks t ON ph.track_id = t.id
         JOIN records r ON t.record_id = r.id
         WHERE ph.user_id = $1
         ORDER BY ph.played_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      this.db.one('SELECT COUNT(*) as total FROM play_history WHERE user_id = $1', [userId])
    ]);

    const total = parseInt(countResult.total);
    return {
      data: plays || [],
      total,
      page,
      limit,
      has_next: offset + limit < total,
      has_prev: page > 1
    };
  }

  // User Preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | null> {
    return await this.db.oneOrNone('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);
  }

  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const fields = Object.keys(preferences).filter(key => key !== 'id' && key !== 'user_id');
    const values = fields.map(field => preferences[field as keyof UserPreferences]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const prefs = await this.db.one(
      `INSERT INTO user_preferences (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET ${setClause}, updated_at = NOW()
       RETURNING *`,
      [userId, ...values]
    );
    return prefs;
  }
}

// =====================================
// SETTINGS AND FEATURE FLAGS
// =====================================

export class ConfigService {
  private db = getDatabase();

  // Settings
  async getSetting(key: string): Promise<Setting | null> {
    return await this.db.oneOrNone('SELECT * FROM settings WHERE key = $1', [key]);
  }

  async getPublicSettings(): Promise<Setting[]> {
    return await this.db.manyOrNone('SELECT * FROM settings WHERE is_public = true ORDER BY category, key') || [];
  }

  async updateSetting(key: string, value: string, updatedBy?: number): Promise<Setting> {
    const setting = await this.db.one(
      `UPDATE settings SET value = $2, last_modified_by = $3, last_modified_at = NOW() 
       WHERE key = $1 RETURNING *`,
      [key, value, updatedBy]
    );
    return setting;
  }

  // Feature Flags
  async getFeatureFlag(key: string): Promise<FeatureFlag | null> {
    return await this.db.oneOrNone('SELECT * FROM feature_flags WHERE key = $1', [key]);
  }

  async evaluateFeatureFlag(key: string, userId?: number, context: Record<string, any> = {}): Promise<boolean> {
    return await this.db.func('evaluate_feature_flag', [key, userId, context]);
  }

  async updateFeatureFlag(key: string, updates: Partial<FeatureFlag>, updatedBy?: number): Promise<FeatureFlag> {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'key');
    const values = fields.map(field => updates[field as keyof FeatureFlag]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const flag = await this.db.one(
      `UPDATE feature_flags SET ${setClause}, last_modified_by = $${fields.length + 2}, updated_at = NOW() 
       WHERE key = $1 RETURNING *`,
      [key, ...values, updatedBy]
    );
    return flag;
  }
}

// =====================================
// AUDIT AND LOGGING
// =====================================

export class AuditService {
  private db = getDatabase();

  async logAuditEvent(
    userId: number | null,
    action: string,
    entityType: string,
    entityId?: number,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata: Record<string, any> = {}
  ): Promise<AuditLog> {
    const log = await this.db.one(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, action, entityType, entityId, oldValues, newValues, metadata]
    );
    return log;
  }

  async getAuditLogs(
    filters: {
      userId?: number;
      entityType?: string;
      entityId?: number;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<AuditLog>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.userId) {
      params.push(filters.userId);
      whereClause += ` AND user_id = $${params.length}`;
    }
    if (filters.entityType) {
      params.push(filters.entityType);
      whereClause += ` AND entity_type = $${params.length}`;
    }
    if (filters.entityId) {
      params.push(filters.entityId);
      whereClause += ` AND entity_id = $${params.length}`;
    }
    if (filters.action) {
      params.push(filters.action);
      whereClause += ` AND action = $${params.length}`;
    }
    if (filters.startDate) {
      params.push(filters.startDate);
      whereClause += ` AND performed_at >= $${params.length}`;
    }
    if (filters.endDate) {
      params.push(filters.endDate);
      whereClause += ` AND performed_at <= $${params.length}`;
    }

    const [logs, countResult] = await Promise.all([
      this.db.manyOrNone(
        `SELECT * FROM audit_logs ${whereClause} ORDER BY performed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      this.db.one(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`, params)
    ]);

    const total = parseInt(countResult.total);
    return {
      data: logs || [],
      total,
      page,
      limit,
      has_next: offset + limit < total,
      has_prev: page > 1
    };
  }
}

// =====================================
// EXPORT ALL SERVICES
// =====================================

export const dbServices = {
  users: new UserService(),
  stores: new StoreService(),
  records: new RecordService(),
  tracks: new TrackService(),
  audioMatches: new AudioMatchService(),
  userFeatures: new UserFeaturesService(),
  config: new ConfigService(),
  audit: new AuditService(),
};