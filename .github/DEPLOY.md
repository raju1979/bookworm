# GitHub Actions → Hostinger

## One-time setup

1. Push this repo to GitHub (`main` branch).
2. Repo **Settings → Secrets and variables → Actions** → add:

| Secret | Example |
|--------|---------|
| `FTP_SERVER` | Hostinger FTP host (hPanel → Files → FTP accounts) |
| `FTP_USERNAME` | FTP username |
| `FTP_PASSWORD` | FTP password |
| `FTP_SERVER_DIR` | `/public_html/bookworm/` |
| `DB_USER` | `u409673832_bookworm` |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | `u409673832_bookwork` |
| `FIREBASE_PROJECT_ID` | `bookworm-6c9ec` (optional) |

3. Push to `main` (or **Actions → Deploy Hostinger → Run workflow**).

## What it does

- Builds Vue (`/bookworm/` base)
- Packs PHP API under `backend/`
- FTPs `backend-php/dist/deploy/` → Hostinger `FTP_SERVER_DIR`

## Local pack (no CI)

```bash
cd backend-php && npm run pack:web
# → dist/bookworm-hostinger.zip + dist/deploy/
```
