# GEA Product Catalogue

A document-first product catalogue built with Next.js 16, Supabase, and Tailwind CSS.

## Features

- **Public Catalogue**: Professional PDF-like catalogue with cover, contents, category sections, and product detail pages
- **Admin Panel**: Protected area for managing products, categories, and images
- **Supabase Integration**: PostgreSQL database with Row Level Security
- **Image Management**: Supabase Storage for product and category images
- **Excel Import**: Import existing product data from Excel

## Tech Stack

- Next.js 16 (App Router)
- Supabase (Database, Auth, Storage)
- Tailwind CSS 4
- TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your credentials:
   - Project URL
   - Anon (public) key
   - Service role key (keep secret!)
3. Run the SQL schema in the Supabase SQL Editor (see `supabase/schema.sql`)
   - For an existing project, run `supabase/migrations/20260920_product_images.sql` to add the five-image product gallery and migrate existing product images.
   - Run `supabase/migrations/20260920_catalogue_sections.sql` to enable custom editorial sections.
   - Run `supabase/migrations/20260920_catalogue_settings.sql` to enable cover, contact, and final-page configuration.
   - Run `supabase/migrations/20260920_catalogue_pdf.sql` to enable the automatic catalogue PDF system.
4. Create storage buckets:
   - `product-images` (public, 5MB limit, image types)
   - `category-images` (public, 5MB limit, image types)
   - `catalogue-cover` (public, 5MB limit, image types)
   - `catalogue-sections` (public, 5MB limit, image types)
   - `catalogue-pdfs` (public, 50MB limit, `application/pdf` only) — created automatically on first PDF generation if missing

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

### 3. Import Product Data

```bash
npm run import
```

This reads `PRODUCT LIST (1).xlsx` and imports all products and categories into Supabase.

### 4. Create Admin User

In Supabase Dashboard → Authentication → Users → Add User:
- Email: your admin email
- Password: secure password
- Email Confirm: true

> **Important**: For the login to succeed, the user **must be email-confirmed** in the Supabase Dashboard.
> Supabase returns the same "Invalid login credentials" error for an unconfirmed user as for a wrong
> password — so if login fails, check Authentication → Users → confirm the user is `Email Confirmed`,
> then log in again.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public catalogue.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

## Project Structure

```
src/
├── app/
│   ├── api/admin/          # Admin API routes
│   ├── admin/              # Admin panel pages
│   ├── catalogue/          # Public catalogue pages
│   └── layout.tsx          # Root layout
├── components/
│   └── catalogue/          # Catalogue UI components
├── lib/
│   ├── admin-actions.ts    # Admin server actions
│   ├── auth.ts             # Auth utilities
│   ├── catalog-supabase.ts # Supabase data access
│   ├── catalog.ts          # Local data fallback
│   ├── storage.ts          # Supabase Storage helpers
│   ├── supabase.ts         # Supabase client
│   ├── supabase-types.ts   # TypeScript types
│   └── types.ts            # Legacy types
├── data/
│   └── product-data.json   # Local product data (fallback)
└── scripts/
    ├── import-to-supabase.ts  # Excel import script
    └── run-import.ts          # Import runner
```

## Admin Panel

The admin panel at `/admin` provides:

- **Dashboard**: Overview stats (products, categories, published/draft counts)
- **Products**: List, search, filter, create, edit, delete, publish/unpublish
- **Categories**: List, reorder, create, edit, delete, publish/unpublish

## Public Catalogue

The public catalogue at `/catalogue` features:

- **Cover page**: Brand, title, year, cover image
- **Contents page**: Table of contents with category links and page numbers
- **Category sections**: Divider pages with category image, product grid
- **Product detail**: Large image, name, category, description, prev/next navigation
- **Responsive**: 2 products/row mobile, 3–4 tablet, 5 wide desktop (larger, document-style tiles on a 1360px sheet)
- **Search**: Discreet search with instant results

## Deployment

### Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run import` - Import Excel data to Supabase
- `npm run pdf:export -- ./gea-catalogue-2026.pdf` - Export the public catalogue using its print stylesheet

### PDF export

Start the app first, then export the dedicated print route (`/catalogue/print`) used by the automatic PDF generator:

```bash
npx playwright install chromium
npm run dev
CATALOGUE_URL=http://localhost:3000 npm run pdf:export -- ./gea-catalogue-2026.pdf
```

The exporter waits for fonts and images, applies print media, and writes an A4 PDF. Set
`NEXT_PUBLIC_SITE_URL` for deployed canonical URLs and `CATALOGUE_URL` when exporting from a different host.

## Automatic Catalogue PDF

The system keeps **one current PDF** — `catalogue-pdfs/catalogue/GEA-Product-Catalogue-2026.pdf` — and
regenerates it in place whenever catalogue content changes. There is no version history and no duplicate files.

### How it works

1. Every public-catalogue write (products, categories, sections, images, settings, ordering) calls
   `markPdfOutdated()` → the status row (`catalogue_pdf_status`) becomes `outdated` and `content_version` increments.
2. A short debounce (default 60s, `PDF_DEBOUNCE_SECONDS`) batches several quick edits into one generation.
3. Generation renders the dedicated `/catalogue/print` route (same Supabase data, GEA branding, A4 pages, page
   numbers, cover and contact/QR pages) with Playwright + Chromium — not a screenshot of the website.
4. The new PDF is uploaded **after** a successful render (upsert → replaces the old file), then status becomes `current`.
5. If generation fails, the previous working PDF is left untouched, status becomes `failed`, and the admin panel
   shows the error with a **Retry Generation** button. The public **Download PDF** button keeps serving the last
   working PDF; if none exists yet it shows a quiet "PDF preparing" state.

### Automatic triggers

- **In-process (default):** `markPdfOutdated` schedules a debounced generation automatically — works on any
  long-running server (`next start`, VPS, PM2).
- **Cron endpoint (recommended for serverless/restarts):** hit `GET /api/catalogue/pdf/cron` on a schedule
  (e.g. every minute). If you set `PDF_CRON_SECRET`, requests must send it as `x-pdf-cron-secret`.
  - Vercel: add a Cron Job hitting that URL.
  - Supabase: see the optional `pg_cron`/`pg_net` block at the bottom of `supabase/migrations/20260920_catalogue_pdf.sql`.
- **Manual:** the admin **Catalogue PDF** page (`/admin/pdf`) has **Generate PDF** / **Retry Generation** buttons.
  Only one generation job may run at a time (the status row acts as the lock; concurrent attempts return 409/busy).

### Downloads & caching

The public `Download PDF` button calls `GET /api/catalogue/pdf`, which streams the single stored file with
`Cache-Control: no-cache, must-revalidate` so browsers and CDNs always retrieve the newest copy at the fixed URL,
without changing the visible filename (`GEA-Product-Catalogue-2026.pdf`).

## Database Schema

See `supabase/schema.sql` for the complete schema including:
- `categories` table with RLS policies
- `products` table with RLS policies
- Indexes for performance
- Updated_at triggers

## Image Handling

- Product images: `/images/products/{slug}.{ext}`
- Category images: `/images/categories/{slug}.{ext}`
- Cover image: `/images/cover/cover.{ext}`
- Supports: JPG, JPEG, PNG, WebP
- Automatic fallback to placeholder when missing
- Automatic extension detection

## Security

- Row Level Security on all tables
- Public read access only for published content
- Admin actions use service role (bypasses RLS)
- Auth-protected admin routes
- No secrets in frontend code
