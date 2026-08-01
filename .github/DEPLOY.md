# GitHub Actions → Hostinger (SFTP)

## Why not FTP?
GitHub runners often **time out on port 21**. Hostinger shared hosting expects **SFTP on port 65002**.

## Secrets

| Secret | Value |
|--------|--------|
| `FTP_SERVER` | From hPanel → **FTP Accounts** / **SSH Access** (e.g. `srv1674.hstgr.io`) — not a random web IP |
| `FTP_USERNAME` | FTP/SSH user |
| `FTP_PASSWORD` | FTP/SSH password |
| `FTP_PORT` | `65002` (optional; workflow defaults to this) |
| `FTP_SERVER_DIR` | e.g. `/public_html/bookworm` or `/home/uXXXX/public_html/bookworm` |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL |
| `FIREBASE_PROJECT_ID` | `bookworm-6c9ec` |

## Hostinger checklist
1. hPanel → enable **SFTP** / SSH remote access if offered  
2. Confirm host + port **65002** in SSH/FTP details  
3. Path must be the real folder for `bookworm` (File Manager path)

## Run
Push to `main` or **Actions → Deploy Hostinger → Run workflow**.
