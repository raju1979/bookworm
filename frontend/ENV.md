# Frontend env files

| File | When loaded |
|------|-------------|
| `.env.development` | `npm run dev` |
| `.env.production` | `npm run build` / `npm run build:prod` |

## Commands

```bash
# Local app (uses .env.development → API http://127.0.0.1:3080)
npm run dev

# Production build for Hostinger (uses .env.production)
npm run build:prod
```

Output: `frontend/dist/` — upload into `public_html/bookworm/`  
(or `cd ../backend-php && npm run pack:web` to zip web+API together)

## Important

Do **not** put `VITE_API_URL` in `.env.local` — Vite applies it to **all** modes and it can override production builds.  
For local-only overrides, use `.env.development.local` (gitignored).
