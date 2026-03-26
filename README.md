# Store Ops

A full-stack retail operations demo built with Next.js.  
This repo currently showcases a bakery/cake-shop management workflow, but the structure is general enough to extend into a broader store operations system.

## What It Includes

- Dashboard with operational KPIs and recent orders
- Product management with stock control
- Order management with filtering and order detail view
- Sales reporting by period
- Local SQLite-backed backend with seeded demo data

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- SQLite via Node `node:sqlite`

## Project Structure

### Frontend

- `src/app`
  - App routes and page entrypoints
- `src/components`
  - Reusable UI components

### Backend

- `src/server/db`
  - Database connection, schema initialization, and seed/bootstrap logic
- `src/server/dashboard`
  - Dashboard read-model queries
- `src/server/products`
  - Product repository and business logic
- `src/server/orders`
  - Order repository and business logic
- `src/server/sales`
  - Sales read-model queries
- `src/server/shared`
  - Shared server constants, types, and formatting helpers

## Database

The app uses a local SQLite database stored at:

- `data/veloura-cakes.db`

Database bootstrap and seed logic live in:

- `src/server/db/index.ts`
- `scripts/init-db.ts`

## Scripts

Run the development server:

```bash
cmd /c npm run dev
```

Build for production:

```bash
cmd /c npm run build
```

Run lint:

```bash
cmd /c npm run lint
```

Initialize the database:

```bash
cmd /c npm run db:init
```

Force reseed the database:

```bash
cmd /c npm run db:seed
```

## Main Routes

- `/`
- `/dashboard`
- `/products`
- `/orders`
- `/orders/[id]`
- `/sales`

## Development Notes

- Route-local server actions stay in `src/app/.../actions.ts`
- Repositories handle SQL and raw data access
- Feature `index.ts` modules handle business logic and orchestration
- The current backend is designed to stay inside one Next.js app, not as a separate API service

## Docs

- `docs/phase-1-blueprint.md`
- `docs/data-model.md`

## Notes

- `node:sqlite` is currently marked experimental by Node, so you may see a warning in local runs
