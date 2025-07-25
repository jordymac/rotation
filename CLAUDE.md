# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Rotation** is a scrollable vinyl discovery tool for DJs and record collectors built on Next.js. The app presents Discogs data as an interactive scroll feed with embedded audio previews, designed for selectors, store staff, and online crate-diggers.

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
```

The development server runs at http://localhost:3000.

## Architecture & Structure

This is a Next.js 15 application using the App Router pattern with TypeScript and Tailwind CSS.

### Key Directories
- `src/app/` - Next.js pages and routing (App Router)
- `src/components/` - Planned UI building blocks (RecordCard, TrackEmbed)
- `src/data/` - Planned static JSON for releases (records.json)

### Current State
- Fresh Next.js create-next-app setup with default landing page
- Uses Geist fonts (sans and mono variants)
- Tailwind CSS configured for rapid UI development
- TypeScript with strict configuration

### Planned Features (from README)
- Scrollable feed UI (vertical for releases, horizontal for tracks)
- Embedded YouTube previews for audio
- Buy links integration (Discogs, Bandcamp)
- Staff curation section
- Ready-to-embed feed for record stores

### Technical Stack
- Next.js 15 with App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- ESLint with Next.js config
- Planned: YouTube embeds for audio previews
- Planned: JSON as local mock DB for Discogs data

### Development Notes
The app is in early development phase - currently just the Next.js boilerplate. The main functionality (RecordCard components, TrackEmbed components, JSON data structure, and scroll interface) needs to be implemented according to the MVP features outlined in the README.