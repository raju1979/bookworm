# GitHub Actions → Hostinger

## FTP vs FTPS vs SFTP

Deploy uses **plain FTP** (port **21**) — matching FileZilla “plain FTP” for this Hostinger account.

| Protocol | Port (Hostinger shared) | Used by this workflow? |
|----------|-------------------------|------------------------|
| Plain FTP | 21 | Yes |
| FTPS | 21 | No (this account rejects TLS) |
| SFTP (SSH) | 65002 | No |

In FileZilla use **FTP** + **Only use plain FTP (insecure)**, port **21**. Update GitHub secrets `FTP_USERNAME` / `FTP_PASSWORD` to the new FTP user.

## If files don’t update on Hostinger

1. In FileZilla, note the **first folder you see after connect**.
2. Set `FTP_SERVER_DIR` accordingly:

| FileZilla starts in | Set `FTP_SERVER_DIR` to |
|---------------------|-------------------------|
| `public_html` | `bookworm/` |
| account root (`u409673832`) | `public_html/bookworm/` |
| already inside `bookworm` | `./` or empty → use `.` carefully; prefer `bookworm/` from parent |

3. Delete junk on server: `__MACOSX`, `bookworm-hostinger.zip`, `UPLOAD.txt`
4. Re-run **Actions → Deploy Hostinger**

## Secrets

| Secret | Example |
|--------|---------|
| `FTP_SERVER` | Hostinger FTP hostname or IP |
| `FTP_USERNAME` | `u409673832` |
| `FTP_PASSWORD` | … |
| `FTP_SERVER_DIR` | `bookworm/` (most common if FTP home is `public_html`) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL |
| `FIREBASE_PROJECT_ID` | `bookworm-6c9ec` |

Deploy uses **lftp mirror --delete** over plain FTP so files are force-replaced.
