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
4. Create storage buckets:
   - `product-images` (public, 5MB limit, image types)
   - `category-images` (public, 5MB limit, image types)
   - `catalogue-cover` (public, 5MB limit, image types)

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