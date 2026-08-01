# GitHub Actions → Hostinger

## FTP vs FTPS vs SFTP

Deploy uses **FTPS** (FTP over TLS, port **21**).

| Protocol | Port (Hostinger shared) | Used by this workflow? |
|----------|-------------------------|------------------------|
| FTP / FTPS | 21 | Yes (FTPS) |
| SFTP (SSH) | 65002 | No — different protocol |

If FileZilla / an action says *“Failed to connect… server only supports SFTP”*:
1. In FileZilla set protocol to **FTP - File Transfer Protocol** and encryption to **Require explicit FTP over TLS**, port **21** (not SFTP).
2. Confirm `FTP_SERVER` is the host from **hPanel → Files → FTP Accounts** (hostname or IP), not an SSH-only host.
3. Confirm username/password match that FTP account.

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

Deploy uses **lftp mirror --delete** over FTPS so files are force-replaced.
