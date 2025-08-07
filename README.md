This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# 🎛️ Rotation

**Rotation** is a scrollable vinyl discovery tool for DJs and record collectors — built on Discogs data, curated vibes, and audio previews.

---

## 🧠 Purpose

Make digging fun and useful again.

Instead of static Discogs listings, Rotation turns record collections into an interactive scroll feed with embedded audio previews and light curation — designed for selectors, store staff, and anyone crate-digging online.

---

## 🏗️ MVP Features

- [x] Built with Next.js (App Router) with TypeScript
- [x] Store management system with Discogs API integration
- [x] Scrollable feed UI with vinyl records from store inventory
- [x] Advanced audio matching with YouTube/Discogs embedded videos (in development)
- [x] PostgreSQL database with Redis caching layer
- [x] Admin interface for record store management
- [x] Atomic design component architecture
- [x] Real-time audio match processing and approval system
- [ ] Buy links and price comparison
- [ ] Public staff feeds and selector pages

---

## 🎵 Audio Preview Status

**Current State**: Audio matching system is actively being developed and refined. The system successfully finds and caches audio matches from Discogs embedded videos and YouTube, but coverage isn't universal.

**Known Limitations**:
- Not every vinyl release has available audio previews
- Some genres/eras have better coverage than others
- Rare or obscure releases may lack digital audio sources

**User Experience**: Records without audio previews will display fallback messaging such as:
- "Listening only available in-store"
- "Purchase anyway - support the dig!"
- Direct purchase links to support record discovery regardless

**Next Steps**: Apple Music API integration planned to significantly expand preview coverage across all genres and release years.

---

## 🔜 Coming Soon (Post-MVP)

- Apple Music API integration for comprehensive audio preview coverage
- Enhanced smart caching system for improved performance
- Consumer-facing discovery features and wishlist functionality
- Tagging suggestions (mood, set time, energy)
- "For You" page based on past engagement
- Multi-store management and analytics
- Social features and sharing capabilities

---

## 📂 Dev Setup

```bash
npm install
npm run dev
```

**Live App**: [https://rotation-sigma.vercel.app/](https://rotation-sigma.vercel.app/)

## 🗃️ Folder Structure

```
src/
  app/            → Next.js pages & API routes (App Router)
    api/          → REST API endpoints for stores, releases, audio matching
    admin/        → Admin dashboard for record store management
    feed/         → Scrollable vinyl discovery feed
  components/     → Atomic design component architecture
    atoms/        → Basic building blocks (buttons, icons, typography)
    molecules/    → Simple components (record cards, track items)
    organisms/    → Complex components (feed grids, management panels)
    templates/    → Page layout templates
  lib/            → Core business logic and services
    audio-matching → Advanced audio matching with ML confidence scoring
    db/           → Database services and PostgreSQL integration
    redis.ts      → Redis caching layer for performance
  types/          → TypeScript definitions
```

## 🎯 Key Pages

- **[Feed](https://rotation-sigma.vercel.app/feed)** - Scrollable vinyl discovery with audio previews
- **[Admin](https://rotation-sigma.vercel.app/admin)** - Store management and audio match approval  
- **[Stores](https://rotation-sigma.vercel.app/stores)** - Browse record store inventory

## 🧱 Tech Stack

**Core Framework**
- Next.js 15 (App Router) with TypeScript
- Tailwind CSS 4 for styling
- Atomic design component architecture

**APIs & Data**
- Discogs API for vinyl data and marketplace integration
- YouTube Data API for audio matching and previews
- PostgreSQL (Supabase) for data persistence
- Redis (Upstash) for caching layer

**Audio Matching (In Development)**
- Enhanced string similarity with Levenshtein distance
- Mix-aware terminology normalization (radio ≠ dub ≠ remix)
- Confidence scoring and auto-approval system
- Discogs embedded video prioritization
- **Current limitation**: Not every record has available videos/previews
- Fallback messaging: "Listening only available in-store" or "Purchase anyway"
- **Planned**: Apple Music API integration for broader preview coverage

**Deployment**
- Vercel for hosting and CI/CD
- Environment-based configuration