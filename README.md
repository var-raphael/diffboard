# Diffboard

A clean dashboard for browsing and querying public datasets from [Quorel](https://quorel.vercel.app).

## What it does

Diffboard pulls live data from Quorel's public dataset API and presents it as searchable, filterable card views instead of raw JSON. Currently wired up to:

- **job-board-listings** — job postings aggregated from public job boards, with search, source filtering, and a dev-roles-only toggle
- **dev-electronics-listings** — Amazon listings for developer hardware (GPUs, RAM, mini PCs, monitors), with search, category and brand filtering

## Stack

- Next.js (App Router)
- TypeScript / TSX
- Vercel Analytics

## How it's wired

Each dataset has:

1. A server-side proxy route under `app/api/<dataset>/route.ts` that fetches from Quorel and returns JSON. This exists so the browser talks to our own server instead of `quorel.vercel.app` directly, avoiding CORS issues.
2. A page under `app/<dataset>/page.tsx` that fetches from the local proxy route, then filters/sorts/dedupes client-side and renders results as cards.

The landing page (`app/page.tsx`) lists both datasets and links out to Quorel for anyone who wants to grab their own.

## Project structure

```
app/
  layout.tsx                          # root layout, fonts, Vercel Analytics
  page.tsx                            # landing page
  job-board-listings/
    page.tsx
  dev-electronics-listings/
    page.tsx
  api/
    job-board-listings/route.ts       # proxy → quorel job-board-listings
    dev-electronics-listings/route.ts # proxy → quorel dev-electronics-listings
```

## Running locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Adding a new dataset

1. Add a proxy route at `app/api/<slug>/route.ts` pointing at the Quorel endpoint.
2. Add a page at `app/<slug>/page.tsx` that fetches from `/api/<slug>` and renders cards.
3. Add an entry to the `DATASETS` array in `app/page.tsx`.

## Notes

- Dark mode is a manual toggle (persisted in `localStorage`), defaulting to system preference on first load.
- Quorel's raw data is inconsistent in places (nulls, duplicate rows, mixed types for fields like price). Each page does its own light cleanup: dedup by a composite key, price parsing for strings like `"$739.99"`, and filtering out entries missing required fields.
