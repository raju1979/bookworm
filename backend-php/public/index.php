<?php

declare(strict_types=1);

$root = dirname(__DIR__);

require $root . '/lib/base.php';
require $root . '/app/env.php';
require $root . '/app/Database.php';
require $root . '/app/Api.php';
require $root . '/app/Auth.php';
require $root . '/app/Users.php';

load_app_env($root);

$f3 = Base::instance();
$f3->set('DEBUG', (env('NODE_ENV', 'development') === 'development') ? 3 : 0);
$f3->set('TEMP', $root . '/tmp/');
$f3->set('UI', $root . '/app/');

if (!is_dir($root . '/tmp')) {
    mkdir($root . '/tmp', 0775, true);
}

[$base, $path] = resolve_request_base_and_path();
if ($base !== '') {
    $f3->set('BASE', $base);
}
$f3->set('PATH', $path);

Api::cors();

require $root . '/app/routes.php';

$f3->set('ONERROR', function ($f3) {
    $code = (int) $f3->get('ERROR.code');
    $text = (string) $f3->get('ERROR.text');
    if ($code === 404) {
        Api::error('Not Found', 404);
    }
    Api::error($text !== '' ? $text : 'Server error', $code >= 400 ? $code : 500);
});

$f3->run();

/**
 * Support both pretty URLs and /public URLs on Hostinger:
 *   /bookworm/backend/books
 *   /bookworm/backend/public/books
 * Local PHP built-in server has BASE '' and PATH from URI.
 */
function resolve_request_base_and_path(): array
{
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));

    $configured = env('APP_BASE');
    $configured = $configured !== null ? rtrim($configured, '/') : '';

    $candidates = [];
    if ($configured !== '') {
        $candidates[] = $configured . '/public';
        $candidates[] = $configured;
    }
    if ($scriptDir !== '/' && $scriptDir !== '') {
        $candidates[] = rtrim($scriptDir, '/');
        if (str_ends_with($scriptDir, '/public')) {
            $candidates[] = substr($scriptDir, 0, -strlen('/public'));
        }
    }

    $candidates = array_values(array_unique(array_filter($candidates)));

    // Longest matching prefix wins
    usort($candidates, static fn ($a, $b) => strlen($b) <=> strlen($a));

    foreach ($candidates as $candidate) {
        if ($uri === $candidate || str_starts_with($uri, $candidate . '/')) {
            $path = substr($uri, strlen($candidate)) ?: '/';
            if ($path === '') {
                $path = '/';
            }
            // If somehow left with /public/... under shorter base, peel it
            if (str_starts_with($path, '/public/') || $path === '/public') {
                $path = substr($path, strlen('/public')) ?: '/';
                return [$candidate . '/public', $path];
            }
            return [$candidate, $path];
        }
    }

    return ['', $uri];
}
