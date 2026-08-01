# GitHub Actions → Hostinger

## Deploy

On push to `main`, builds Vue + PHP and mirrors to `FTP_SERVER_DIR` over **plain FTP**.

| Secret | Example |
|--------|---------|
| `FTP_SERVER` | hostname or IP from hPanel FTP Accounts |
| `FTP_USERNAME` | FTP user |
| `FTP_PASSWORD` | … |
| `FTP_SERVER_DIR` | `bookworm/` (if FTP login is already inside `public_html`) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL |
| `FIREBASE_PROJECT_ID` | `bookworm-6c9ec` |

| FileZilla starts in | Set `FTP_SERVER_DIR` to |
|---------------------|-------------------------|
| site files (no `public_html` folder) | `bookworm/` |
| account root with `public_html/` visible | `public_html/bookworm/` |

Live URL: `https://ajarafashion.com/bookworm/`
