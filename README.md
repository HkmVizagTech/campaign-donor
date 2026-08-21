# Garbha Gudi Campaign Admin

Internal admin system for managing temple donor attendance campaigns via WhatsApp.

## Architecture

```
garbha-gudi-campaign/
├── apps/api/          → Express + MongoDB (deploy on Railway)
├── apps/web/          → Next.js frontend (deploy on Vercel)
├── packages/shared/   → Shared enums, types, constants
└── packages/validation/ → Shared Zod schemas
```

## Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select `HkmVizagTech/campaign-donor` → **Set root directory to `apps/api`**
3. Railway will detect the Node.js project. Set these environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` (Railway sets this automatically, but include it) |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | Your Vercel frontend URL (e.g. `https://garbhagudi.vercel.app`) |
| `GUPSHUP_ENABLED` | `false` (enable later) |
| `GUPSHUP_API_KEY` | *(leave empty for now)* |
| `GUPSHUP_APP_ID` | *(leave empty for now)* |
| `GUPSHUP_SOURCE_NUMBER` | *(leave empty for now)* |
| `GUPSHUP_WEBHOOK_SECRET` | *(leave empty for now)* |
| `GUPSHUP_TEMPLATE_ID` | `1935120a-4688-4ebb-94bc-c96739a4fe99` (the template's actual ID, not its name) |
| `GUPSHUP_TEMPLATE_NAME` | `garbagudi_nirman_message` |

4. **Build settings** (Railway should auto-detect, but if not):

| Setting | Value |
|---|---|
| Build Command | `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @garbha-gudi/shared build && pnpm --filter @garbha-gudi/validation build && pnpm --filter @garbha-gudi/api build` |
| Start Command | `cd ../.. && pnpm --filter @garbha-gudi/api start` |
| Install Command | `npm install -g pnpm && pnpm install --frozen-lockfile` |

5. After deploy, Railway gives you a URL like `https://your-app.up.railway.app`
6. Set this as the `FRONTEND_URL` env var in Railway
7. Run the seed script once via Railway shell: `pnpm --filter @garbha-gudi/api seed`
8. Login: `admin@garbhagudi.com` / `admin123` (change password immediately)

## Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import `HkmVizagTech/campaign-donor`
2. **Set root directory to `apps/web`**
3. Framework: **Next.js** (auto-detected)
4. Set environment variable:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Railway API URL + `/api` (e.g. `https://your-app.up.railway.app/api`) |

5. Vercel will auto-build and deploy

## Local Development

```bash
# Install pnpm (if not installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Start MongoDB locally, then seed
pnpm seed

# Start API (port 4000) and Frontend (port 3000)
pnpm dev
```

Login: `admin@garbhagudi.com` / `admin123`

## Environment Variables

See `apps/api/.env.example` and `apps/web/.env.local.example`.
