# GitHub Actions → Hostinger

## Current mode: hello-world only

Uploads only `hello-world.txt` to `FTP_SERVER_DIR` (no site build).

## Fix: `Name or service not known`

`FTP_SERVER` must be a **hostname or IP** that resolves in DNS — copy it from **hPanel → Files → FTP Accounts → Hostname**.

| Correct | Wrong |
|---------|--------|
| `ftp.ajarafashion.com` | `ftp://ftp.ajarafashion.com` |
| `82.112.229.227` | `public_html` / `public_html/knowledge` |
| | FTP username |
| | folder path |

Also set:

| Secret | Example |
|--------|---------|
| `FTP_USERNAME` | from FTP Accounts |
| `FTP_PASSWORD` | from FTP Accounts |
| `FTP_SERVER_DIR` | `knowledge/` |
