<?php

declare(strict_types=1);

/**
 * Load KEY=VALUE pairs from .env into putenv/$_ENV.
 */
function load_env(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }
        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}

function env(string $key, ?string $default = null): ?string
{
    $v = $_ENV[$key] ?? getenv($key);
    if ($v === false || $v === null || $v === '') {
        return $default;
    }
    return (string) $v;
}

/**
 * Load env for local or Hostinger.
 *
 * Local:
 *   .env              → APP_ENV=development|production
 *   .env.development  → full local config
 *   .env.production   → full prod config (optional locally)
 *
 * Hostinger pack:
 *   single .env with all production keys (APP_ENV=production included)
 */
function load_app_env(string $root): void
{
    $switcher = $root . '/.env';
    if (is_file($switcher)) {
        load_env($switcher);
    }

    $appEnv = env('APP_ENV', 'development') ?? 'development';
    $appEnv = preg_replace('/[^a-z0-9_-]/i', '', $appEnv) ?: 'development';

    $specific = $root . '/.env.' . $appEnv;
    if (is_file($specific)) {
        load_env($specific);
    }
}
