This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# 🎛️ Rotation

**Rotation** is a scrollable vinyl discovery tool for DJs and record collectors — built on Discogs data, curated vibes, and audio previews.

---

## 🧠 Purpose

Make digging fun and useful again.

Instead of static Discogs listings, Rotation turns record collections into an interactive scroll feed with embedded audio previews and light curation — designed for selectors, store staff, and anyone crate-digging online.

---

## 🏗️ MVP Features

- [x] Built with Next.js (App Router)
- [x] Local JSON record dataset for dev
- [ ] Scrollable feed UI  
  - Vertical = releases  
  - Horizontal = tracks per release
- [ ] Embedded YouTube previews
- [ ] Buy links (Discogs, Bandcamp)
- [ ] Staff curation section ("Now Playing" / "Staff Picks")
- [ ] Ready-to-embed feed for record stores

---

## 🔜 Coming Soon (Post-MVP)

- Smart caching of Discogs data (by release ID)
- Tagging suggestions (mood, set time, energy)
- "For You" page based on past engagement
- Price comparison (local vs overseas + currency conversion)
- Public staff feeds and selector pages

---

## 📂 Dev Setup

```bash
npm install
npm run dev
```

App runs at: http://localhost:3000

## 🗃️ Folder Structure

```
src/
  app/            → Next.js pages & routing
  components/     → UI building blocks (RecordCard, TrackEmbed)
  data/           → Static JSON for releases (records.json)
```

## 📋 To Do (Dev Notes)

- [ ] Add records.json with 5–10 sample releases
- [ ] Build RecordCard.tsx and TrackEmbed.tsx
- [ ] Wire up vertical + horizontal scroll
- [ ] Add mock audio previews
- [ ] Add hover/click buy buttons

## 🧱 Stack

- Next.js (App Router)
- Tailwind CSS (for fast UI building)
- YouTube embed (for previews)
- JSON as local mock DB (Discogs data)
- Vercel (for hosting)