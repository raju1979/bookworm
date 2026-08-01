<?php

declare(strict_types=1);

// Router for: php -S 0.0.0.0:3080 -t public public/router.php
// (Useful even when targeting Apache for final deploy.)

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$file = __DIR__ . $path;

if ($path !== '/' && is_file($file)) {
    return false;
}

require __DIR__ . '/index.php';
