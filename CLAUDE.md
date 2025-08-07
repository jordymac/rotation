# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Key Directories
- `src/app/` - Next.js pages and API routes (App Router)
- `src/components/` - UI components following atomic design
  - `atoms/` - Basic building blocks (Button, Icons, etc.)
  - `molecules/` - Simple components (ActionButtons, RecordCard, TrackListItem, etc.)
  - `organisms/` - Complex components (AudioMatchingModal, RecordTable, StoreManagement)
  - `templates/` - Page layout templates
- `src/lib/` - Core business logic and services
- `src/hooks/` - React hooks for shared functionality
- `src/types/` - TypeScript type definitions

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
- `/api/stores/[storeId]/inventory` - Store inventory management
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
- Clerk integration configured but not fully implemented
- User roles and permissions need completion

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
- Clerk for authentication (configured)

**Audio Matching Technology**
- Enhanced string similarity with Levenshtein distance
- Mix-aware terminology normalization
- Confidence scoring and classification
- Strict incompatibility rules for dance music mixes

### Environment Configuration

Required environment variables in `.env.local`:
- `DISCOGS_USER_TOKEN` - Discogs API authentication
- `NEXT_PUBLIC_YOUTUBE_API_KEY` - YouTube Data API key
- `POSTGRES_URL_NON_POOLING` - PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL` - Redis cache URL
- Clerk authentication keys (if using auth)

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

**Inventory Management Strategy (See INVENTORY_MANAGEMENT.md)**
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
1. **Implement smart caching system** (INVENTORY_MANAGEMENT.md)
2. **Background processing queue** for new releases
3. **Performance monitoring** and cache hit rate analytics