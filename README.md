# Store Ops

A full-stack retail operations demo built as a monorepo.  
It currently showcases a bakery/cake-shop management workflow, but the structure is general enough to extend into a broader store operations system.

## What It Includes

- Dashboard with operational KPIs and recent orders
- Product management with stock control
- Order management with filtering and order detail view
- Sales reporting by period
- Local SQLite-backed backend with seeded demo data

## Stack

- `apps/web`: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- `apps/api`: Fastify, TypeScript, `pg`
- Database: Supabase Postgres

## Project Structure

### Monorepo

- `apps/web`
  - Next.js frontend app
- `apps/api`
  - Standalone Fastify backend
- `packages/shared`
  - Shared workspace for future types/validation

### Web App Structure (`apps/web`)

- `src/app`
  - App routes and page entrypoints
- `src/components`
  - Reusable UI components
### API Structure (`apps/api`)

- `src/routes`
  - Fastify route registration
- `src/modules`
  - Feature repositories and services
- `src/db`
  - Postgres connection and transaction helpers
- `sql`
  - Schema and seed SQL

## Scripts

Run the development server:

```bash
npm run dev
```

Run web and API together:

```bash
npm run dev:all
```

Build for production:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Check the API database connection:

```bash
npm run db:check:api
```

Apply the API schema:

```bash
npm run db:migrate:api
```

Seed the API database:

```bash
npm run db:seed:api
```

## Main Routes

- `/`
- `/dashboard`
- `/products`
- `/orders`
- `/orders/[id]`
- `/sales`

## Environment Setup

### API

Create `apps/api/.env` from [apps/api/.env.example](C:\Users\Jedidiah\OneDrive\Desktop\Projects\cake shop\apps\api\.env.example):

```bash
API_HOST=0.0.0.0
PORT=4000
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

Use the Supabase transaction pooler URI.

### Web

Create `apps/web/.env` from [apps/web/.env.example](C:\Users\Jedidiah\OneDrive\Desktop\Projects\cake shop\apps\web\.env.example):

```bash
STORE_OPS_API_URL=http://127.0.0.1:4000
```

The web app will then read and write through the standalone API.

## Deployment

Recommended setup:

- frontend: Vercel
- backend: Render
- database: Supabase Postgres

### Render (API)

The repo includes [render.yaml](C:\Users\Jedidiah\OneDrive\Desktop\Projects\cake shop\render.yaml) for the API service.

Set these environment variables in Render:

- `DATABASE_URL`
  - Supabase transaction pooler URI
- `CORS_ORIGIN`
  - your Vercel frontend URL

Render will:

- build with `npm run build:api`
- run migrations before deploy
- start the API with `npm run start:api`

After the first deploy, seed demo data manually once:

```bash
npm run db:seed:api
```

### Vercel (Web)

Create a Vercel project using:

- root directory: `apps/web`

Set:

- `STORE_OPS_API_URL`
  - your Render API URL, for example `https://store-ops-api.onrender.com`

## Docs

- `docs/phase-1-blueprint.md`
- `docs/data-model.md`

## Notes

- The API path is the intended deployed path.
- Some internal SQLite fallback code still exists in `apps/web` for local safety, but production should point to `apps/api`.
