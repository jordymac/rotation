# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ IMPORTANT: Activity Logging

**MANDATORY REQUIREMENT**: All significant changes MUST be logged in [`ACTIVITY.md`](ACTIVITY.md).

### When to Update ACTIVITY.md
- ✅ Database migrations or schema changes
- ✅ Security fixes or policy updates
- ✅ Dependency additions/removals
- ✅ Feature implementations or refactors
- ✅ Breaking changes or architecture decisions
- ✅ Multi-file changes affecting core functionality

### How to Update ACTIVITY.md
1. **At the START of work**: Add new session entry with context
2. **During work**: Update with files created/modified
3. **At the END of work**: Mark status and add any blockers

See [`ACTIVITY.md`](ACTIVITY.md) for format and examples.

## Project Overview

**Rotation** is a vinyl discovery tool for DJs and record collectors built on Next.js. The app focuses on store management with sophisticated audio matching capabilities, designed for record store staff and vinyl selectors who need to verify and manage audio previews for their inventory.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database migration (production)
curl -X POST https://rotation-sigma.vercel.app/api/admin/migrate
```

The development server runs at https://rotation-sigma.vercel.app/.

## Architecture & Structure

This is a Next.js 15 application using the App Router pattern with TypeScript and Tailwind CSS, following atomic design principles.

### Key Directories & Component Structure

#### Core Application Structure
- `src/app/` - Next.js pages and API routes (App Router)
  - `admin/` - Admin interface pages (store management, review)
  - `api/` - API endpoints organized by feature
  - `auth/` - Authentication pages
  - `feed/` - Consumer feed interface
  - `stores/` - Store browsing and individual store pages
- `src/middleware.ts` - Request middleware for auth/routing
- `src/server/` - Server-side utilities and services

#### UI Components (Atomic Design)
- `src/components/ui/` - Base UI primitives (button, card, dialog, etc.)
- `src/components/atoms/` - Smallest reusable components
  - `ConfidenceIndicator.tsx` - Audio match confidence visualization
  - `Icons.tsx` - Icon components
  - `MetricState.tsx` - Metric display states
  - `PlayButton.tsx` - Audio playback control
  - `TrackStatus.tsx` - Track processing status indicator
  - `Typography.tsx` - Text styling components
- `src/components/molecules/` - Compound components combining atoms
  - `ActionButtons.tsx` - Action button groups
  - `AlbumArtwork.tsx` - Album cover display with fallbacks
  - `AudioMatchCandidate.tsx` - Individual match candidate display
  - `RecordCard.tsx` - Main record display component
  - `TrackListItem.tsx` - Individual track in lists
  - `YouTubePreview.tsx` - Embedded YouTube player
- `src/components/organisms/` - Complex feature components
  - **Admin Components**:
    - `AdminQueuePane.tsx` - Processing queue management
    - `AdminRecordPane.tsx` - Record detail admin interface
    - `AdminTrackInspector.tsx` - Track-level inspection
    - `AdminTracksPane.tsx` - Track listing and management
  - **Core Features**:
    - `FeedGrid.tsx` - Main feed display grid
    - `FeedWindow.tsx` - Feed container with scroll handling
    - `RecordTable.tsx` - Tabular record display
    - `StoreList.tsx` - Store directory listing
    - `StoreManagement.tsx` - Store admin interface
- `src/components/templates/` - Full page templates
  - `AdminReviewTemplate.tsx` - Admin review interface layout
  - `AdminTemplate.tsx` - General admin page layout
  - `FeedTemplate.tsx` - Consumer feed page layout
  - `HomeTemplate.tsx` - Landing page layout
  - `PageLayout.tsx` - Base page wrapper
  - `StoresTemplate.tsx` - Store directory layout

#### API Route Organization
- `api/admin/` - Administrative endpoints
  - `releases/[id]/` - Release-specific admin actions
  - `stores/[id]/` - Store management endpoints
  - `review/` - Content review workflow
- `api/auth/` - Authentication endpoints
- `api/feed/` - Consumer feed data
- `api/storefront/` - Store browsing endpoints
- `api/user/` - User profile and preferences

#### Core Services & Logic
- `src/lib/` - Core business logic
  - `audio-match-orchestrator.ts` - Audio matching workflow controller
  - `audio-matching-engine.ts` - Core matching algorithms
  - `db.ts` & `db-services.ts` - Database connections and queries
  - `discogs-service.ts` - Discogs API integration
  - `redis.ts` - Caching layer
  - `analytics.ts` - Usage tracking
- `src/hooks/` - Reusable React logic
  - `useAudioMatch.ts` - Audio matching state management
  - `useStoreMetrics.ts` - Store statistics
  - `usePreloadQueue.ts` & `useTwoStageLoading.ts` - Performance optimization
- `src/types/` - TypeScript definitions
  - `database.ts` - Database schema types
  - `admin-review.ts` - Admin workflow types
  - `user.ts` - User data structures
- `src/utils/` - Utility functions
  - `discogs.ts` - Discogs data helpers
  - `featuring.ts` - Artist name parsing
  - `perfProfile.ts` - Performance monitoring

### Current Implementation Status

#### ✅ COMPLETED FEATURES

**Store Management System**
- Complete admin interface for record stores at `/admin`
- Real-time Discogs API integration for inventory management
- Store statistics and analytics dashboard
- Background processing for audio verification

**Advanced Audio Matching Engine**
- Mix-aware matching with dance music terminology support
- Strict compatibility rules (radio ≠ dub ≠ remix)
- YouTube Data API integration with confidence scoring
- Discogs embedded video prioritization
- Database persistence with PostgreSQL + Redis caching

**Database Infrastructure**
- PostgreSQL database with Supabase hosting
- Redis caching layer with Upstash
- Complete CRUD operations for track matches
- Migration system and health checks

**API Endpoints**
- `/api/admin/releases/[id]/audio-match` - Enhanced audio matching
- `/api/storefront/[storeId]/inventory` - Store inventory management
- `/api/admin/setup` - Database health checks
- `/api/admin/migrate` - Database table creation

**UI Components (Atomic Design)**
- Full component library with consistent styling
- Responsive design optimized for record store workflows
- Loading states, error handling, and user feedback
- Audio preview integration with YouTube embeds

#### 🚧 PARTIALLY COMPLETE

**Consumer Feed Experience**
- Feed template exists but needs integration
- Scroll functionality needs optimization
- Audio player integration needs refinement

**Authentication & User Management**
- ⚠️ **NO AUTHENTICATION SYSTEM** - Clerk has been removed
- All API routes are currently unauthenticated
- Admin routes accessible without authentication (temporary)
- See [`ACTIVITY.md`](ACTIVITY.md) session `CLERK-REMOVAL-2025-10-28-002` for details

#### ❌ TODO (Future Enhancements)

**Public-Facing Features**
- Consumer vinyl discovery feed
- User wishlist and crate functionality
- Social features and sharing
- Mobile app optimization

**Advanced Store Features**
- Multi-store management
- Inventory sync automation
- Sales analytics and reporting
- Customer relationship management

### Technical Stack

**Core Technologies**
- Next.js 15 with App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- PostgreSQL with Supabase
- Redis with Upstash

**External APIs**
- Discogs API for vinyl data, audio matching and marketplace integration
- YouTube Data API for audio matching and previews when Discogs listing does not include Videos

**Audio Matching Technology**
- **AudioMatchingEngine**: Mix-aware matching with dance music intelligence
- **AudioMatchOrchestrator**: Caching, persistence, and workflow management
- Enhanced string similarity with Levenshtein distance
- Confidence scoring and classification  
- Strict incompatibility rules for dance music mixes

### Environment Configuration

Required environment variables in `.env.local`:

**Core API Keys:**
- `DISCOGS_USER_TOKEN` - Discogs API authentication
- `DISCOGS_CONSUMER_KEY` - Discogs OAuth consumer key
- `DISCOGS_CONSUMER_SECRET` - Discogs OAuth consumer secret

**YouTube API (⚠️ SECURITY ISSUE):**
- `NEXT_PUBLIC_YOUTUBE_API_KEY` - YouTube Data API key
- **WARNING**: Currently exposed to browsers via NEXT_PUBLIC prefix
- **TODO**: Move to server-side `YOUTUBE_API_KEY` for security

**Database & Cache:**
- `POSTGRES_URL_NON_POOLING` - PostgreSQL connection string (primary)
- `POSTGRES_URL` - PostgreSQL connection string (fallback)  
- `DATABASE_URL` - PostgreSQL connection string (fallback)
- `UPSTASH_REDIS_REST_URL` - Redis cache URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis cache authentication

**Development:**
- `FEED_DEV_LIMIT` - Development API call limits
- `NODE_ENV` - Environment detection (development/production)

### Development Notes

**Current Focus: Store Management MVP**
The application is currently optimized for record store staff workflow:
1. Store owners add their Discogs username
2. System automatically loads their inventory
3. Background audio matching runs for all releases
4. Staff can review and approve audio matches via modal interface
5. Approved matches are cached for fast feed generation

**Audio Matching Algorithm**
- Prioritizes Discogs embedded videos (85% confidence threshold)
- Falls back to YouTube search (50% confidence threshold)
- Mix-aware matching prevents cross-assignment (radio ≠ dub ≠ remix)
- Auto-approves high-confidence matches for immediate use

**Inventory Management Strategy (See docs/workflows/inventory-management.md)**
Current system makes real-time Discogs API calls on every load (inefficient).

**Planned Improvement:** Smart caching system where:
- Real-time Discogs API calls only for new listings
- Releases with ≥1 confident audio match get stored in database
- Subsequent loads pull from database (fast) + API (new items only)
- Expected 85% reduction in API calls and 50-80% faster load times

**Implementation Status**
- ✅ Core audio matching and database persistence working
- 🚧 Smart caching system design completed (see INVENTORY_MANAGEMENT.md)
- ❌ Background processing queue and migration strategy pending

**Known Issues**
- Current system: Real-time API calls on every inventory load (inefficient)
- YouTube API rate limits need monitoring in production  
- SoundCloud integration disabled (can be re-enabled)

**Next Priority**
1. **Implement smart caching system** (docs/workflows/inventory-management.md)
2. **Background processing queue** for new releases
3. **Performance monitoring** and cache hit rate analytics

## Development Workflow and Documentation Policy

**MANDATORY PRE-WORK REQUIREMENT**: Before working on any feature or component, you MUST:

1. **Identify the feature area** you're working on (store management, audio matching, feed, admin, etc.)
2. **Check the Documentation Index** below to find relevant workflow documentation
3. **Read the appropriate workflow docs** BEFORE making any changes
4. **Update documentation** if your changes modify existing workflows

**Feature-to-Documentation Mapping**:
- **Admin features** → Read: admin-audio-matching.md, admin-inbox-review.md, admin-store-management.md
- **Store/Inventory work** → Read: inventory-management.md, store-browsing.md, admin-store-management.md
- **Feed/Consumer features** → Read: unified-feed-experience.md, store-browsing.md
- **Audio matching** → Read: admin-audio-matching.md, admin-inbox-review.md
- **Component work** → Read: docs/NAMING.md + relevant workflow docs
- **API changes** → Read: docs/api/ + relevant workflow docs

**Documentation Requirements**:
For every major component or workflow you work on, you MUST either:

1. **Check existing documentation** in `docs/` directory and update it if changes were made
2. **Create workflow documentation** if none exists for a major component/feature

**When to create/update documentation**:
- Creating new major components (organisms, templates, API routes)
- Modifying existing workflows that affect user experience  
- Performance optimizations or architectural changes
- Adding new features or endpoints

**Documentation should include**:
- Purpose and overview
- Step-by-step workflow/usage
- API endpoints and data flow
- Performance considerations  
- Error handling and troubleshooting

**Location**: All workflow docs go in `docs/workflows/` or `docs/components/` - NOT in root directory.

**Quick Reference**: See `docs/README.md` for full documentation standards and directory structure.

### Documentation Index
- **Workflows**: `docs/workflows/` - Feature and process documentation
  - [Admin Audio Matching](docs/workflows/admin-audio-matching.md) - Audio matching workflow for administrators
  - [Admin Inbox Review](docs/workflows/admin-inbox-review.md) - Admin review process for pending matches
  - [Admin Store Management](docs/workflows/admin-store-management.md) - Store administration and management
  - [Background Processing Automation](docs/workflows/background-processing-automation.md) - Hybrid processing system
  - [Database Schema](docs/workflows/database-schema.md) - Complete database architecture and roadmap
  - [Inventory Management](docs/workflows/inventory-management.md) - Smart caching architecture
  - [Store Browsing](docs/workflows/store-browsing.md) - Optimized store directory system
  - [Unified Feed Experience](docs/workflows/unified-feed-experience.md) - Consumer feed and discovery
- **Components**: `docs/components/` - Component-specific documentation
- **API**: `docs/api/` - Endpoint documentation and examples
- **Standards**: `docs/NAMING.md` - Naming conventions and code standards