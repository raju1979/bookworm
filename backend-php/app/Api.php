<?php

declare(strict_types=1);

final class Api
{
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $status = 400): void
    {
        self::json(['statusCode' => $status, 'message' => $message], $status);
    }

    public static function body(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    public static function queryInt($f3, string $key, int $default): int
    {
        $v = $f3->get("GET.{$key}");
        if ($v === null || $v === '') {
            return $default;
        }
        return (int) $v;
    }

    /** Map DB snake_case timestamps to Nest/Sequelize-style camelCase. */
    public static function row(?array $row): ?array
    {
        if ($row === null) {
            return null;
        }

        $out = [];
        foreach ($row as $key => $value) {
            if ($key === 'created_at') {
                $out['createdAt'] = self::iso($value);
                continue;
            }
            if ($key === 'updated_at') {
                $out['updatedAt'] = self::iso($value);
                continue;
            }
            $out[$key] = $value;
        }
        return $out;
    }

    public static function rows(array $rows): array
    {
        return array_map([self::class, 'row'], $rows);
    }

    public static function iso($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d\TH:i:s.000\Z');
        }
        $ts = strtotime((string) $value);
        if ($ts === false) {
            return (string) $value;
        }
        return gmdate('Y-m-d\TH:i:s.000\Z', $ts);
    }

    /**
     * CORS + optional hard Origin whitelist (Hostinger).
     *
     * Set in .env:
     *   ENFORCE_ORIGIN_WHITELIST=true
     *   CORS_ORIGINS=https://ajarafashion.com,https://www.ajarafashion.com
     *
     * Note: Origin can be spoofed by non-browser clients. This stops casual
     * browser abuse; protected routes still need Firebase Auth.
     */
    public static function cors(): void
    {
        $originsCfg = env('CORS_ORIGINS', '*') ?? '*';
        $requestOrigin = trim($_SERVER['HTTP_ORIGIN'] ?? '');
        $enforce = self::envFlag('ENFORCE_ORIGIN_WHITELIST');
        $allowEmpty = self::envFlag('ORIGIN_ALLOW_EMPTY', false);

        $allowed = [];
        if ($originsCfg !== '*') {
            $allowed = array_values(array_filter(array_map('trim', explode(',', $originsCfg))));
        }

        if ($enforce && $originsCfg !== '*') {
            $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
            $path = rtrim($path, '/') ?: '/';
            $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
            $isProbe = in_array($method, ['GET', 'HEAD'], true)
                && (
                    $path === '/'
                    || str_ends_with($path, '/health')
                    || preg_match('#/bookworm(/backend|/public)?$#', $path)
                );

            if (!$isProbe) {
                if ($requestOrigin === '') {
                    // Same-site navigation / address-bar / some WebViews send no Origin.
                    // Allow empty Origin for safe reads; still block empty on writes.
                    $safeRead = in_array($method, ['GET', 'HEAD', 'OPTIONS'], true);
                    if (!$allowEmpty && !$safeRead) {
                        self::error('Origin not allowed', 403);
                    }
                } elseif (!in_array($requestOrigin, $allowed, true)) {
                    self::error('Origin not allowed', 403);
                }
            }
        }

        if ($originsCfg === '*') {
            header('Access-Control-Allow-Origin: *');
        } else {
            if ($requestOrigin !== '' && in_array($requestOrigin, $allowed, true)) {
                header('Access-Control-Allow-Origin: ' . $requestOrigin);
                header('Vary: Origin');
            } elseif ($requestOrigin === '' && isset($allowed[0])) {
                // Non-browser tools: still advertise first allowed origin
                header('Access-Control-Allow-Origin: ' . $allowed[0]);
                header('Vary: Origin');
            }
        }

        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            if ($enforce && $originsCfg !== '*' && $requestOrigin !== '' && !in_array($requestOrigin, $allowed, true)) {
                self::error('Origin not allowed', 403);
            }
            http_response_code(204);
            exit;
        }
    }

    private static function envFlag(string $key, bool $default = false): bool
    {
        $v = env($key);
        if ($v === null || $v === '') {
            return $default;
        }
        return in_array(strtolower($v), ['1', 'true', 'yes', 'on'], true);
    }
}
