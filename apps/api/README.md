# API

Standalone backend for `store-ops`.

## Current Status

The API is live and owns the main business features:

- Fastify server
- CORS enabled
- `GET /health` with database readiness details
- Postgres/Supabase environment support
- SQL schema and seed files under `sql/`
- database helper and check scripts
- live feature endpoints for:
  - `/dashboard`
  - `/products`
  - `/orders`
  - `/orders/:id`
  - `/sales`

## Environment

Create an env file from:

- `.env.example`

Required value:

- `DATABASE_URL`

Optional values:

- `API_HOST`
- `PORT`
- `CORS_ORIGIN`

## Database Commands

Check connectivity:

```bash
npm run db:check
```

Apply the schema:

```bash
npm run db:migrate
```

Seed demo data:

```bash
npm run db:seed
```

## Deploying on Render

This repo includes a root [render.yaml](C:\Users\Jedidiah\OneDrive\Desktop\Projects\cake shop\render.yaml) for the API service.

Required environment variables on Render:

- `DATABASE_URL`
- `CORS_ORIGIN`

Recommended values:

- `DATABASE_URL`
  - Supabase transaction pooler URI
- `CORS_ORIGIN`
  - your Vercel frontend URL

The Render service:

- builds with `npm run build:api`
- runs schema migration before deploy
- starts with `npm run start:api`
- checks health at `/health`

## Notes

- Use the Supabase pooler URI rather than the direct `db.*` hostname when your local or hosting network has IPv6 issues.
- If you want demo data in production, run the seed command once manually after the first deploy rather than on every start.
