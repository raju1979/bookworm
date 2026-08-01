# GitHub Actions → Hostinger

## Deploy

On push to `main`, builds Vue + PHP and mirrors into **`bookworm/`** on the server (never `deploy/`).

| Secret | Example |
|--------|---------|
| `FTP_SERVER` | hostname or IP from hPanel FTP Accounts |
| `FTP_USERNAME` | FTP user |
| `FTP_PASSWORD` | … |
| `FTP_SERVER_DIR` | leave empty or `bookworm/` — optional `public_html` only if login is account root |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL |
| `FIREBASE_PROJECT_ID` | `bookworm-6c9ec` |

Local pack output: `backend-php/dist/bookworm/` → remote `bookworm/`.

Live URL: `https://ajarafashion.com/bookworm/`

If an old mistaken `deploy/` folder exists on the server, delete it in FileZilla.
