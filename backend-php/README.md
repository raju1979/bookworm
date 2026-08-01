# BookWorm PHP API (Fat-Free)

Parallel port of the NestJS API for Hostinger PHP + MySQL hosting.  
**The Node backend in `../backend` is unchanged.**

## Stack

- [Fat-Free Framework](https://github.com/bcosca/fatfree-core) (vendored in `lib/`)
- PDO MySQL
- Firebase Auth ID-token verify (OpenSSL + Google JWKS, no Composer)

## Local run (before Apache / Hostinger)

PHP built-in server (same front-controller as Apache):

```bash
chmod +x scripts/serve.sh
./scripts/serve.sh
# → http://127.0.0.1:3080
```

Or:

```bash
cd public
/opt/homebrew/bin/php -S 0.0.0.0:3080 router.php
```

Check:

```bash
curl http://127.0.0.1:3080/health
curl http://127.0.0.1:3080/books?limit=5
```

### Apache locally

See `apache-vhost.example.conf`. Document root must be `public/`.

## Config

Two environment files:

| File | Use |
|------|-----|
| `.env` | Switch only: `APP_ENV=development` or `production` |
| `.env.development` | Local CORS (localhost OK) |
| `.env.production` | Hostinger — no localhost, origin whitelist on |

```bash
cp .env.development.example .env.development
cp .env.production.example .env.production
echo 'APP_ENV=development' > .env
```

**Hostinger:** upload `.env` with `APP_ENV=production` and upload `.env.production`  
(or keep a single production `.env` on the server — don’t upload your local `.env.development`).

Copy env (already copied from Nest if you followed setup):

```bash
# Local
APP_ENV=development

# On server
APP_ENV=production
```

## Pack for Hostinger

```bash
cd backend-php
npm run pack        # API only under /bookworm/backend
npm run pack:web    # API + Vue build for /bookworm/
# → dist/bookworm-hostinger.zip
```

On Hostinger after extract:

| URL | What |
|-----|------|
| https://ajarafashion.com/bookworm/ | Vue app |
| https://ajarafashion.com/bookworm/backend | PHP API |

Local dev unchanged: `npm run serve` (PHP :3080) + frontend `npm run dev` (base `/`).

Zip includes production `.env` + `.env.production` only (no `.env.development`).

In `frontend/.env.local`:

```env
VITE_API_URL=http://127.0.0.1:3080
```

Keep Nest on `:3000` when you want the Node API instead.

## Routes (same as Nest)

| Method | Path |
|--------|------|
| GET | `/`, `/health` |
| CRUD | `/users`, `/users/firebase/:uid`, … |
| CRUD | `/books`, `/books/user/:firebaseUid`, … |
| CRUD | `/book-requests`, … |
| CRUD | `/chat-threads`, `/chat-messages`, … |
| CRUD | `/tags`, `/tags/bulk`, … |

Protected routes expect `Authorization: Bearer <Firebase ID token>`.

## Hostinger deploy

1. Upload `app/`, `lib/`, `public/`, `.env`, `tmp/`
2. Set hosting document root to `public/` (or map `public_html` → those files)
3. Confirm `mod_rewrite` / `.htaccess` works
4. Set frontend `VITE_API_URL` to your domain
