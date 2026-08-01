#!/usr/bin/env bash
# Local PHP server (Apache-compatible front controller).
# Final Hostinger deploy uses real Apache + public/.htaccess.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PHP_BIN="${PHP_BIN:-/opt/homebrew/bin/php}"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3080}"

cd "$ROOT/public"
echo "BookWorm PHP API → http://${HOST}:${PORT}"
echo "Health check:    http://127.0.0.1:${PORT}/health"
exec "$PHP_BIN" -S "${HOST}:${PORT}" router.php
