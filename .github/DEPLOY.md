# GitHub Actions → Hostinger

## FTP vs FTPS vs SFTP

Deploy uses **plain FTP** (port **21**) — matching FileZilla “plain FTP” for this Hostinger account.

| Protocol | Port (Hostinger shared) | Used by this workflow? |
|----------|-------------------------|------------------------|
| Plain FTP | 21 | Yes |
| FTPS | 21 | No (this account rejects TLS) |
| SFTP (SSH) | 65002 | No |

In FileZilla use **FTP** + **Only use plain FTP (insecure)**, port **21**. Update GitHub secrets `FTP_USERNAME` / `FTP_PASSWORD` to the new FTP user.

## Nested `public_html/public_html` bug

New Hostinger FTP users often log in **already inside** `public_html`.

| FileZilla starts in | Set `FTP_SERVER_DIR` to |
|---------------------|-------------------------|
| contents of site (`bookworm`, `.htaccess`, …) — **no** `public_html` folder | `bookworm/` |
| account root with a `public_html` folder visible | `public_html/bookworm/` |

If you see `public_html/public_html/bookworm/`, the secret had an extra `public_html/`. Change it to `bookworm/`, delete the nested folder in FileZilla, re-run deploy.

The workflow also auto-strips a leading `public_html/` when the FTP home does not list a `public_html` directory.

## If files don’t update on Hostinger

1. In FileZilla, note the **first folder you see after connect**.
2. Set `FTP_SERVER_DIR` using the table above.
3. Delete junk on server: nested `public_html`, `__MACOSX`, `bookworm-hostinger.zip`, `UPLOAD.txt`
4. Re-run **Actions → Deploy Hostinger**

## Secrets

| Secret | Example |
|--------|---------|
| `FTP_SERVER` | Hostinger FTP hostname or IP |
| `FTP_USERNAME` | new FTP user |
| `FTP_PASSWORD` | … |
| `FTP_SERVER_DIR` | `bookworm/` (typical for FTP users chrooted to public_html) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL |
| `FIREBASE_PROJECT_ID` | `bookworm-6c9ec` |

Deploy uses **lftp mirror --delete** over plain FTP so files are force-replaced.

## FTP Hello World Test

To verify credentials/path without a full build:

1. Push the workflow (or merge to `main`)
2. **Actions → FTP Hello World Test → Run workflow**
3. Set `remote_dir` to e.g. `knowledge/` (if login is already in `public_html`) or `public_html/knowledge/` (if you see `public_html` at login)
4. Confirm `hello-world.txt` appears in FileZilla at that path

This workflow only needs `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` — it ignores `FTP_SERVER_DIR`.
