# GitHub Actions → Hostinger

## Current mode: hello-world only

`Deploy Hostinger` on push to `main` uploads **only** `hello-world.txt` to `FTP_SERVER_DIR`. No frontend/PHP build.

| Secret | Example |
|--------|---------|
| `FTP_SERVER` | Hostinger FTP hostname or IP |
| `FTP_USERNAME` | FTP user |
| `FTP_PASSWORD` | … |
| `FTP_SERVER_DIR` | `knowledge/` (if login is already in public_html) |

Plain FTP port 21. Leading `public_html/` is auto-stripped when the FTP home does not list a `public_html` folder.

After a green run, check FileZilla for `knowledge/hello-world.txt` (or whatever path you set).
